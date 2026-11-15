import type { ReaderDeletionClient } from "./deleteReaderAccount";
import {
  partitionReaderBooks,
  type ReaderBookRow,
} from "./partitionReaderBooks";

const PAGE_SIZE = 1000;
const IN_CHUNK = 100;

const BOOK_CHILD_TABLES = [
  "collective_reading_comment_reactions",
  "collective_reading_comments",
  "quotes",
  "schedule",
  "book_authors",
  "custom_shelf_books",
  "user_book_favorites",
  "book_reading_ratings",
] as const;

type Row = Record<string, unknown>;

type PageResult = {
  data: Row[] | null;
  error: { message: string } | null;
  count?: number | null;
};

export function isMissingCascadeFunction(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("schema cache") ||
    (normalized.includes("could not find the function") &&
      normalized.includes("delete_reader_cascade"))
  );
}

function chunk(values: string[]): string[][] {
  const parts: string[][] = [];
  for (let index = 0; index < values.length; index += IN_CHUNK) {
    parts.push(values.slice(index, index + IN_CHUNK));
  }
  return parts;
}

function asBook(row: Row): ReaderBookRow {
  return {
    id: String(row.id ?? ""),
    chosen_by: typeof row.chosen_by === "string" ? row.chosen_by : null,
    user_id: typeof row.user_id === "string" ? row.user_id : null,
    readers: Array.isArray(row.readers)
      ? row.readers.filter((reader): reader is string => typeof reader === "string")
      : [],
  };
}

async function readPages(
  load: (from: number, to: number) => Promise<PageResult>,
): Promise<{ rows: Row[]; error: string | null }> {
  const rows: Row[] = [];
  let from = 0;
  let previousLastId: unknown;

  while (true) {
    const { data, error } = await load(from, from + PAGE_SIZE - 1);
    if (error) return { rows: [], error: error.message };
    const page = data ?? [];
    if (page.length === 0) break;
    const lastId = page[page.length - 1]?.id;
    if (previousLastId !== undefined && lastId === previousLastId) break;
    rows.push(...page);
    previousLastId = lastId;
    from += page.length;
  }

  return { rows, error: null };
}

async function deleteWhereIn(
  client: ReaderDeletionClient,
  table: string,
  column: string,
  values: string[],
): Promise<string | null> {
  for (const part of chunk(values)) {
    const { error } = await client.from(table).delete().in(column, part);
    if (error) return error.message;
  }
  return null;
}

async function cleanupRelatedBooks(
  client: ReaderDeletionClient,
  userId: string,
  livingUserIds: ReadonlySet<string>,
): Promise<string | null> {
  const columns = "id, chosen_by, user_id, readers";
  const byChosen = await readPages((from, to) =>
    client
      .from("books")
      .select(columns)
      .eq("chosen_by", userId)
      .order("id")
      .range(from, to),
  );
  if (byChosen.error) return byChosen.error;

  const byRegistrar = await readPages((from, to) =>
    client
      .from("books")
      .select(columns)
      .eq("user_id", userId)
      .order("id")
      .range(from, to),
  );
  if (byRegistrar.error) return byRegistrar.error;

  const byReader = await readPages((from, to) =>
    client
      .from("books")
      .select(columns)
      .contains("readers", [userId])
      .order("id")
      .range(from, to),
  );
  if (byReader.error) return byReader.error;

  const { deleteIds, detach } = partitionReaderBooks(
    [...byChosen.rows, ...byRegistrar.rows, ...byReader.rows].map(asBook),
    userId,
    livingUserIds,
  );

  for (const table of BOOK_CHILD_TABLES) {
    const message = await deleteWhereIn(client, table, "book_id", deleteIds);
    if (message) return message;
  }

  const booksError = await deleteWhereIn(client, "books", "id", deleteIds);
  if (booksError) return booksError;

  for (const book of detach) {
    const { error } = await client
      .from("books")
      .update({
        readers: book.readers,
        chosen_by: book.chosen_by,
        user_id: book.user_id,
      })
      .eq("id", book.id);
    if (error) return error.message;
  }

  return null;
}

async function deleteWhereEq(
  client: ReaderDeletionClient,
  table: string,
  column: string,
  value: string,
): Promise<string | null> {
  const { error } = await client.from(table).delete().eq(column, value);
  return error?.message ?? null;
}

export async function deleteReaderCascadeFallback(
  client: ReaderDeletionClient,
  userId: string,
): Promise<{ error: string | null; status: 200 | 404 | 409 | 500 } | null> {
  const target = await client
    .from("users")
    .select("id, tier")
    .eq("id", userId)
    .maybeSingle();

  if (target.error) return { error: target.error.message, status: 500 };
  if (!target.data) return { error: "Usuário não encontrado.", status: 404 };

  const tier = typeof target.data.tier === "string" ? target.data.tier : null;
  if (tier === "admin") {
    const admins = await client
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("tier", "admin");
    if (admins.error) return { error: admins.error.message, status: 500 };
    if ((admins.count ?? 0) <= 1) {
      return {
        error: "Não é possível excluir o último admin.",
        status: 409,
      };
    }
  }

  const people = await readPages((from, to) =>
    client.from("users").select("id").order("id").range(from, to),
  );
  if (people.error) return { error: people.error, status: 500 };
  const livingUserIds = new Set(
    people.rows
      .map((row) => row.id)
      .filter((id): id is string => typeof id === "string" && id.length > 0),
  );

  const firstCleanup = await cleanupRelatedBooks(client, userId, livingUserIds);
  if (firstCleanup) return { error: firstCleanup, status: 500 };

  const shelves = await readPages((from, to) =>
    client
      .from("custom_shelves")
      .select("id")
      .eq("user_id", userId)
      .order("id")
      .range(from, to),
  );
  if (shelves.error) return { error: shelves.error, status: 500 };
  const shelfIds = shelves.rows
    .map((row) => row.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
  const shelfBooksError = await deleteWhereIn(
    client,
    "custom_shelf_books",
    "shelf_id",
    shelfIds,
  );
  if (shelfBooksError) return { error: shelfBooksError, status: 500 };
  const shelfError = await deleteWhereEq(
    client,
    "custom_shelves",
    "user_id",
    userId,
  );
  if (shelfError) return { error: shelfError, status: 500 };

  const scoped: Array<[string, string]> = [
    ["schedule", "owner"],
    ["collective_reading_comment_reactions", "user_id"],
    ["collective_reading_comments", "user_id"],
    ["user_book_favorites", "user_id"],
    ["book_reading_ratings", "user_id"],
    ["user_followers", "follower_id"],
    ["user_followers", "following_id"],
    ["user_notification_preferences", "follower_id"],
    ["user_notification_preferences", "following_id"],
    ["notifications", "recipient_id"],
    ["notifications", "actor_id"],
    ["register_invites", "created_by"],
  ];
  for (const [table, column] of scoped) {
    const message = await deleteWhereEq(client, table, column, userId);
    if (message) return { error: message, status: 500 };
  }

  const settings = await client
    .from("registration_settings")
    .update({ updated_by: null })
    .eq("updated_by", userId);
  if (settings.error) return { error: settings.error.message, status: 500 };

  const finalCleanup = await cleanupRelatedBooks(client, userId, livingUserIds);
  if (finalCleanup) return { error: finalCleanup, status: 500 };

  if (tier === "admin") {
    const admins = await client
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("tier", "admin");
    if (admins.error) return { error: admins.error.message, status: 500 };
    if ((admins.count ?? 0) <= 1) {
      return {
        error: "Não é possível excluir o último admin.",
        status: 409,
      };
    }
  }

  const profile = await deleteWhereEq(client, "users", "id", userId);
  if (profile) return { error: profile, status: 500 };

  return null;
}
