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

export type ReaderBookRow = {
  id: string;
  chosen_by: string | null;
  user_id: string | null;
  readers: string[] | null;
};

export type DetachedReaderBook = {
  id: string;
  chosen_by: string;
  user_id: string | null;
  readers: string[];
};

export type ReaderDeletionError = { message: string } | null;

export type ReaderDeletionSelectResult = {
  data: Array<Record<string, unknown>> | null;
  error: ReaderDeletionError;
};

export type ReaderDeletionMutationResult = {
  error: ReaderDeletionError;
};

type RangedQuery = {
  order: (
    column: string,
    options?: { ascending?: boolean },
  ) => {
    range: (from: number, to: number) => Promise<ReaderDeletionSelectResult>;
  };
};

export type ReaderDeletionClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => RangedQuery;
      contains: (column: string, values: string[]) => RangedQuery;
    };
    delete: () => {
      eq: (column: string, value: string) => Promise<ReaderDeletionMutationResult>;
      in: (
        column: string,
        values: string[],
      ) => Promise<ReaderDeletionMutationResult>;
    };
    update: (values: Record<string, unknown>) => {
      eq: (
        column: string,
        value: string,
      ) => Promise<ReaderDeletionMutationResult>;
    };
  };
  auth: {
    admin: {
      deleteUser: (userId: string) => Promise<ReaderDeletionMutationResult>;
    };
  };
};

function survivorIds(book: ReaderBookRow, userId: string): string[] {
  const ids = new Set<string>();
  for (const readerId of book.readers ?? []) {
    if (readerId && readerId !== userId) ids.add(readerId);
  }
  if (book.chosen_by && book.chosen_by !== userId) ids.add(book.chosen_by);
  return [...ids];
}

export function partitionReaderBooks(
  books: ReaderBookRow[],
  userId: string,
): { deleteIds: string[]; detach: DetachedReaderBook[] } {
  const unique = new Map<string, ReaderBookRow>();
  for (const book of books) {
    if (book.id) unique.set(book.id, book);
  }

  const deleteIds: string[] = [];
  const detach: DetachedReaderBook[] = [];

  for (const book of unique.values()) {
    const survivors = survivorIds(book, userId);
    if (survivors.length === 0) {
      deleteIds.push(book.id);
      continue;
    }

    detach.push({
      id: book.id,
      chosen_by:
        book.chosen_by && book.chosen_by !== userId
          ? book.chosen_by
          : survivors[0],
      user_id: book.user_id === userId ? null : book.user_id,
      readers: (book.readers ?? []).filter(
        (readerId) => readerId && readerId !== userId,
      ),
    });
  }

  return { deleteIds, detach };
}

function asBook(row: Record<string, unknown>): ReaderBookRow {
  return {
    id: String(row.id ?? ""),
    chosen_by: typeof row.chosen_by === "string" ? row.chosen_by : null,
    user_id: typeof row.user_id === "string" ? row.user_id : null,
    readers: Array.isArray(row.readers) ? row.readers.map(String) : [],
  };
}

function chunk(values: string[]): string[][] {
  const parts: string[][] = [];
  for (let index = 0; index < values.length; index += IN_CHUNK) {
    parts.push(values.slice(index, index + IN_CHUNK));
  }
  return parts;
}

async function fetchPages(
  loadPage: (from: number, to: number) => Promise<ReaderDeletionSelectResult>,
): Promise<{ rows: ReaderBookRow[]; error: string | null }> {
  const rows: ReaderBookRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await loadPage(from, from + PAGE_SIZE - 1);
    if (error) return { rows: [], error: error.message };
    const page = data ?? [];
    rows.push(...page.map(asBook));
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return { rows, error: null };
}

async function fetchRelatedBooks(
  client: ReaderDeletionClient,
  userId: string,
): Promise<{ rows: ReaderBookRow[]; error: string | null }> {
  const columns = "id, chosen_by, user_id, readers";
  const byChosen = await fetchPages((from, to) =>
    client
      .from("books")
      .select(columns)
      .eq("chosen_by", userId)
      .order("id", { ascending: true })
      .range(from, to),
  );
  if (byChosen.error) return byChosen;

  const byRegistrar = await fetchPages((from, to) =>
    client
      .from("books")
      .select(columns)
      .eq("user_id", userId)
      .order("id", { ascending: true })
      .range(from, to),
  );
  if (byRegistrar.error) return byRegistrar;

  const byReader = await fetchPages((from, to) =>
    client
      .from("books")
      .select(columns)
      .contains("readers", [userId])
      .order("id", { ascending: true })
      .range(from, to),
  );
  if (byReader.error) return byReader;

  return {
    rows: [...byChosen.rows, ...byRegistrar.rows, ...byReader.rows],
    error: null,
  };
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

async function deleteUserShelves(
  client: ReaderDeletionClient,
  userId: string,
): Promise<string | null> {
  const shelfIds: string[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await client
      .from("custom_shelves")
      .select("id")
      .eq("user_id", userId)
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) return error.message;
    const page = data ?? [];
    for (const row of page) {
      if (typeof row.id === "string" && row.id) shelfIds.push(row.id);
    }
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  const shelfBooksError = await deleteWhereIn(
    client,
    "custom_shelf_books",
    "shelf_id",
    shelfIds,
  );
  if (shelfBooksError) return shelfBooksError;

  return deleteWhereEq(client, "custom_shelves", "user_id", userId);
}

async function deleteUserScopedRows(
  client: ReaderDeletionClient,
  userId: string,
): Promise<string | null> {
  const steps: Array<[string, string]> = [
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

  for (const [table, column] of steps) {
    const message = await deleteWhereEq(client, table, column, userId);
    if (message) return message;
  }

  const { error } = await client
    .from("registration_settings")
    .update({ updated_by: null })
    .eq("updated_by", userId);

  return error?.message ?? null;
}

export async function deleteReaderAccount(
  client: ReaderDeletionClient,
  userId: string,
): Promise<{ error: string | null }> {
  const related = await fetchRelatedBooks(client, userId);
  if (related.error) return { error: related.error };

  const { deleteIds, detach } = partitionReaderBooks(related.rows, userId);

  for (const table of BOOK_CHILD_TABLES) {
    const message = await deleteWhereIn(client, table, "book_id", deleteIds);
    if (message) return { error: message };
  }

  const booksError = await deleteWhereIn(client, "books", "id", deleteIds);
  if (booksError) return { error: booksError };

  for (const book of detach) {
    const { error } = await client
      .from("books")
      .update({
        readers: book.readers,
        chosen_by: book.chosen_by,
        user_id: book.user_id,
      })
      .eq("id", book.id);
    if (error) return { error: error.message };
  }

  const shelvesError = await deleteUserShelves(client, userId);
  if (shelvesError) return { error: shelvesError };

  const scopedError = await deleteUserScopedRows(client, userId);
  if (scopedError) return { error: scopedError };

  const profileError = await deleteWhereEq(client, "users", "id", userId);
  if (profileError) return { error: profileError };

  const { error: authDeleteError } = await client.auth.admin.deleteUser(userId);
  if (authDeleteError) {
    console.error("Auth deleteUser failed after profile delete", {
      userId,
      message: authDeleteError.message,
    });
    return {
      error:
        "Dados removidos, mas não foi possível remover o login. Contate o suporte.",
    };
  }

  return { error: null };
}
