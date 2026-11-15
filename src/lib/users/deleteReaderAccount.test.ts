import { describe, expect, it } from "vitest";

import {
  deleteReaderAccount,
  partitionReaderBooks,
  type ReaderBookRow,
  type ReaderDeletionClient,
  type ReaderDeletionMutationResult,
  type ReaderDeletionSelectResult,
} from "./deleteReaderAccount";

type Row = Record<string, unknown>;

function createMemory(
  initial: Record<string, Row[]>,
  fail?: { table: string; action: "delete" | "update" },
) {
  const tables: Record<string, Row[]> = structuredClone(initial);
  const authDeleted: string[] = [];

  function rows(table: string): Row[] {
    if (!tables[table]) tables[table] = [];
    return tables[table];
  }

  function matches(row: Row, column: string, value: unknown, op: "eq" | "in" | "contains") {
    const current = row[column];
    if (op === "eq") return current === value;
    if (op === "in") return Array.isArray(value) && value.includes(current);
    if (op === "contains") {
      return (
        Array.isArray(current) &&
        Array.isArray(value) &&
        value.every((item) => current.includes(item))
      );
    }
    return false;
  }

  function page(matched: Row[], from: number, to: number): ReaderDeletionSelectResult {
    return { data: matched.slice(from, to + 1), error: null };
  }

  const client: ReaderDeletionClient = {
    from(table: string) {
      return {
        select() {
          return {
            eq(column: string, value: string) {
              return {
                order() {
                  return {
                    range(from: number, to: number) {
                      const matched = rows(table).filter((row) =>
                        matches(row, column, value, "eq"),
                      );
                      return Promise.resolve(page(matched, from, to));
                    },
                  };
                },
              };
            },
            contains(column: string, values: string[]) {
              return {
                order() {
                  return {
                    range(from: number, to: number) {
                      const matched = rows(table).filter((row) =>
                        matches(row, column, values, "contains"),
                      );
                      return Promise.resolve(page(matched, from, to));
                    },
                  };
                },
              };
            },
          };
        },
        delete() {
          return {
            eq(column: string, value: string) {
              if (fail?.table === table && fail.action === "delete") {
                return Promise.resolve({ error: { message: "fk violation" } });
              }
              tables[table] = rows(table).filter(
                (row) => !matches(row, column, value, "eq"),
              );
              return Promise.resolve({ error: null });
            },
            in(column: string, values: string[]) {
              if (fail?.table === table && fail.action === "delete") {
                return Promise.resolve({ error: { message: "fk violation" } });
              }
              tables[table] = rows(table).filter(
                (row) => !matches(row, column, values, "in"),
              );
              return Promise.resolve({ error: null });
            },
          };
        },
        update(values: Record<string, unknown>) {
          return {
            eq(column: string, value: string) {
              if (fail?.table === table && fail.action === "update") {
                return Promise.resolve({
                  error: { message: "update failed" },
                } satisfies ReaderDeletionMutationResult);
              }
              tables[table] = rows(table).map((row) =>
                matches(row, column, value, "eq") ? { ...row, ...values } : row,
              );
              return Promise.resolve({ error: null });
            },
          };
        },
      };
    },
    auth: {
      admin: {
        deleteUser(userId: string) {
          authDeleted.push(userId);
          return Promise.resolve({ error: null });
        },
      },
    },
  };

  return { client, tables, authDeleted };
}

const target = "user-target";
const other = "user-other";
const witness = "user-witness";

function library() {
  return createMemory({
    users: [
      { id: target, tier: "common_user" },
      { id: other, tier: "common_user" },
      { id: witness, tier: "admin" },
    ],
    books: [
      {
        id: "book-exclusive",
        chosen_by: target,
        user_id: target,
        readers: [target],
      },
      {
        id: "book-collective",
        chosen_by: target,
        user_id: target,
        readers: [target, other],
      },
      {
        id: "book-joined",
        chosen_by: other,
        user_id: target,
        readers: [other, target],
      },
    ],
    quotes: [
      { id: "q-exclusive", book_id: "book-exclusive" },
      { id: "q-collective", book_id: "book-collective" },
      { id: "q-joined", book_id: "book-joined" },
    ],
    schedule: [
      { id: "s-exclusive", book_id: "book-exclusive", owner: target },
      { id: "s-collective-target", book_id: "book-collective", owner: target },
      { id: "s-collective-other", book_id: "book-collective", owner: other },
      { id: "s-joined-target", book_id: "book-joined", owner: target },
      { id: "s-joined-other", book_id: "book-joined", owner: other },
    ],
    book_reading_ratings: [
      { user_id: target, book_id: "book-exclusive" },
      { user_id: target, book_id: "book-joined" },
      { user_id: other, book_id: "book-joined" },
    ],
    collective_reading_comments: [
      { id: "c-joined-target", book_id: "book-joined", user_id: target },
      { id: "c-collective-other", book_id: "book-collective", user_id: other },
      { id: "c-joined-other", book_id: "book-joined", user_id: other },
    ],
    collective_reading_comment_reactions: [
      { id: "r-target", book_id: "book-joined", user_id: target },
      { id: "r-other", book_id: "book-collective", user_id: other },
    ],
    book_authors: [
      { book_id: "book-exclusive", author_id: "author-1" },
      { book_id: "book-collective", author_id: "author-1" },
    ],
    user_book_favorites: [
      { user_id: target, book_id: "book-joined" },
      { user_id: other, book_id: "book-joined" },
    ],
    custom_shelves: [
      { id: "shelf-target", user_id: target },
      { id: "shelf-other", user_id: other },
    ],
    custom_shelf_books: [
      { id: "link-1", shelf_id: "shelf-target", book_id: "book-exclusive" },
      { id: "link-2", shelf_id: "shelf-target", book_id: "book-collective" },
      { id: "link-3", shelf_id: "shelf-other", book_id: "book-exclusive" },
      { id: "link-4", shelf_id: "shelf-other", book_id: "book-joined" },
    ],
    user_followers: [
      { follower_id: target, following_id: other },
      { follower_id: other, following_id: target },
      { follower_id: witness, following_id: other },
    ],
    user_notification_preferences: [
      { follower_id: target, following_id: other },
      { follower_id: witness, following_id: other },
    ],
    notifications: [
      { id: "n-actor", recipient_id: other, actor_id: target },
      { id: "n-recipient", recipient_id: target, actor_id: other },
      { id: "n-kept", recipient_id: other, actor_id: witness },
    ],
    register_invites: [
      { id: "invite-target", created_by: target },
      { id: "invite-other", created_by: other },
    ],
    registration_settings: [{ id: "settings", updated_by: target }],
  });
}

describe("partitionReaderBooks", () => {
  it("apaga o livro exclusivo e destaca o leitor dos livros compartilhados", () => {
    const books: ReaderBookRow[] = [
      {
        id: "solo",
        chosen_by: target,
        user_id: target,
        readers: [target],
      },
      {
        id: "shared",
        chosen_by: target,
        user_id: target,
        readers: [target, other],
      },
    ];

    expect(partitionReaderBooks(books, target)).toEqual({
      deleteIds: ["solo"],
      detach: [
        {
          id: "shared",
          chosen_by: other,
          user_id: null,
          readers: [other],
        },
      ],
    });
  });
});

describe("deleteReaderAccount", () => {
  it("remove em cascata os dados do leitor e preserva o que é dos outros", async () => {
    const memory = library();
    const result = await deleteReaderAccount(memory.client, target);

    expect(result).toEqual({ error: null });
    expect(memory.authDeleted).toEqual([target]);
    expect(memory.tables.users.map((row) => row.id)).toEqual([other, witness]);
    expect(memory.tables.books).toEqual([
      {
        id: "book-collective",
        chosen_by: other,
        user_id: null,
        readers: [other],
      },
      {
        id: "book-joined",
        chosen_by: other,
        user_id: null,
        readers: [other],
      },
    ]);
    expect(memory.tables.quotes.map((row) => row.id)).toEqual([
      "q-collective",
      "q-joined",
    ]);
    expect(memory.tables.schedule.map((row) => row.id)).toEqual([
      "s-collective-other",
      "s-joined-other",
    ]);
    expect(memory.tables.book_reading_ratings).toEqual([
      { user_id: other, book_id: "book-joined" },
    ]);
    expect(memory.tables.collective_reading_comments.map((row) => row.id)).toEqual([
      "c-collective-other",
      "c-joined-other",
    ]);
    expect(
      memory.tables.collective_reading_comment_reactions.map((row) => row.id),
    ).toEqual(["r-other"]);
    expect(memory.tables.book_authors).toEqual([
      { book_id: "book-collective", author_id: "author-1" },
    ]);
    expect(memory.tables.user_book_favorites).toEqual([
      { user_id: other, book_id: "book-joined" },
    ]);
    expect(memory.tables.custom_shelves).toEqual([
      { id: "shelf-other", user_id: other },
    ]);
    expect(memory.tables.custom_shelf_books).toEqual([
      { id: "link-4", shelf_id: "shelf-other", book_id: "book-joined" },
    ]);
    expect(memory.tables.user_followers).toEqual([
      { follower_id: witness, following_id: other },
    ]);
    expect(memory.tables.user_notification_preferences).toEqual([
      { follower_id: witness, following_id: other },
    ]);
    expect(memory.tables.notifications.map((row) => row.id)).toEqual(["n-kept"]);
    expect(memory.tables.register_invites.map((row) => row.id)).toEqual([
      "invite-other",
    ]);
    expect(memory.tables.registration_settings).toEqual([
      { id: "settings", updated_by: null },
    ]);
  });

  it("não remove o login quando a cascata falha", async () => {
    const failing = createMemory(library().tables, {
      table: "quotes",
      action: "delete",
    });
    const result = await deleteReaderAccount(failing.client, target);

    expect(result.error).toBe("fk violation");
    expect(failing.authDeleted).toEqual([]);
    expect(failing.tables.users.map((row) => row.id)).toContain(target);
    expect(failing.tables.books.map((row) => row.id)).toContain("book-exclusive");
  });

  it("não apaga o login de outra pessoa quando o auth falha", async () => {
    const memory = library();
    memory.client.auth.admin.deleteUser = () =>
      Promise.resolve({ error: { message: "auth down" } });

    const result = await deleteReaderAccount(memory.client, target);

    expect(result.error).toContain("login");
    expect(memory.tables.users.map((row) => row.id)).not.toContain(target);
    expect(memory.tables.users.map((row) => row.id)).toContain(other);
  });
});
