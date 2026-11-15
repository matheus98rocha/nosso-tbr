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

type MemoryFail = {
  table: string;
  action: "delete" | "update" | "contains" | "select";
  column?: string;
  call?: number;
};

function createMemory(initial: Record<string, Row[]>, fail?: MemoryFail) {
  const tables: Record<string, Row[]> = structuredClone(initial);
  const authDeleted: string[] = [];
  const inCalls: Array<{ table: string; column: string; size: number }> = [];
  const attempts = new Map<string, number>();

  function rejection(
    table: string,
    action: MemoryFail["action"],
    column: string,
  ): string | null {
    if (!fail || fail.table !== table || fail.action !== action) return null;
    if (fail.column && fail.column !== column) return null;
    const key = `${table}:${action}:${fail.column ?? ""}`;
    const next = (attempts.get(key) ?? 0) + 1;
    attempts.set(key, next);
    if (fail.call !== undefined && fail.call !== next) return null;
    if (action === "update") return "update failed";
    if (action === "delete") return "fk violation";
    return "select failed";
  }

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
                      const message = rejection(table, "select", column);
                      if (message) {
                        return Promise.resolve({
                          data: null,
                          error: { message },
                        });
                      }
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
                      const message = rejection(table, "contains", column);
                      if (message) {
                        return Promise.resolve({
                          data: null,
                          error: { message },
                        });
                      }
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
              const message = rejection(table, "delete", column);
              if (message) return Promise.resolve({ error: { message } });
              tables[table] = rows(table).filter(
                (row) => !matches(row, column, value, "eq"),
              );
              return Promise.resolve({ error: null });
            },
            in(column: string, values: string[]) {
              inCalls.push({ table, column, size: values.length });
              const message = rejection(table, "delete", column);
              if (message) return Promise.resolve({ error: { message } });
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
              const message = rejection(table, "update", column);
              if (message) {
                return Promise.resolve({
                  error: { message },
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

  return { client, tables, authDeleted, inCalls };
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

  it("entrega a responsabilidade ao primeiro leitor restante e preserva quem cadastrou", () => {
    const [book] = partitionReaderBooks(
      [
        {
          id: "handoff",
          chosen_by: target,
          user_id: witness,
          readers: ["", target, witness, other],
        },
      ],
      target,
    ).detach;

    expect(book).toEqual({
      id: "handoff",
      chosen_by: witness,
      user_id: witness,
      readers: [witness, other],
    });
  });

  it("mantém o livro quando o responsável não está na lista de leitores", () => {
    expect(
      partitionReaderBooks(
        [
          {
            id: "kept",
            chosen_by: other,
            user_id: other,
            readers: [target],
          },
          {
            id: "null-readers",
            chosen_by: other,
            user_id: null,
            readers: null,
          },
        ],
        target,
      ),
    ).toEqual({
      deleteIds: [],
      detach: [
        {
          id: "kept",
          chosen_by: other,
          user_id: other,
          readers: [],
        },
        {
          id: "null-readers",
          chosen_by: other,
          user_id: null,
          readers: [],
        },
      ],
    });
  });

  it("mantém o livro quando só quem cadastrou permanece", () => {
    expect(
      partitionReaderBooks(
        [
          {
            id: "registered",
            chosen_by: target,
            user_id: other,
            readers: [target],
          },
        ],
        target,
      ),
    ).toEqual({
      deleteIds: [],
      detach: [
        {
          id: "registered",
          chosen_by: other,
          user_id: other,
          readers: [],
        },
      ],
    });
  });

  it("deduplica o mesmo livro e ignora id vazio", () => {
    expect(
      partitionReaderBooks(
        [
          {
            id: "",
            chosen_by: target,
            user_id: target,
            readers: [target],
          },
          {
            id: "same",
            chosen_by: target,
            user_id: target,
            readers: [target],
          },
          {
            id: "same",
            chosen_by: target,
            user_id: target,
            readers: [target, other],
          },
        ],
        target,
      ),
    ).toEqual({
      deleteIds: [],
      detach: [
        {
          id: "same",
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

  it("não apaga nada quando a busca por participação falha", async () => {
    const memory = createMemory(
      {
        users: [{ id: target, tier: "common_user" }],
        books: [
          {
            id: "only-reader",
            chosen_by: other,
            user_id: other,
            readers: [other, target],
          },
        ],
      },
      { table: "books", action: "contains" },
    );

    const result = await deleteReaderAccount(memory.client, target);

    expect(result.error).toBe("select failed");
    expect(memory.authDeleted).toEqual([]);
    expect(memory.inCalls).toEqual([]);
    expect(memory.tables.books).toEqual([
      {
        id: "only-reader",
        chosen_by: other,
        user_id: other,
        readers: [other, target],
      },
    ]);
    expect(memory.tables.users.map((row) => row.id)).toEqual([target]);
  });

  it("não remove o login quando a passagem do responsável falha", async () => {
    const memory = createMemory(library().tables, {
      table: "books",
      action: "update",
    });

    const result = await deleteReaderAccount(memory.client, target);

    expect(result.error).toBe("update failed");
    expect(memory.authDeleted).toEqual([]);
    expect(memory.tables.users.map((row) => row.id)).toContain(target);
    expect(memory.tables.books.map((row) => row.id)).not.toContain("book-exclusive");
    expect(memory.tables.books).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "book-collective",
          chosen_by: target,
          readers: [target, other],
        }),
        expect.objectContaining({
          id: "book-joined",
          chosen_by: other,
          readers: [other, target],
        }),
      ]),
    );
  });

  it("não apaga o livro nem as notas de quem só está como cadastro", async () => {
    const memory = createMemory({
      users: [
        { id: target, tier: "common_user" },
        { id: other, tier: "common_user" },
      ],
      books: [
        {
          id: "registered-by-other",
          chosen_by: target,
          user_id: other,
          readers: [target],
        },
      ],
      quotes: [{ id: "q-kept", book_id: "registered-by-other" }],
    });

    const result = await deleteReaderAccount(memory.client, target);

    expect(result).toEqual({ error: null });
    expect(memory.authDeleted).toEqual([target]);
    expect(memory.tables.books).toEqual([
      {
        id: "registered-by-other",
        chosen_by: other,
        user_id: other,
        readers: [],
      },
    ]);
    expect(memory.tables.quotes).toEqual([
      { id: "q-kept", book_id: "registered-by-other" },
    ]);
  });

  it("apaga livros exclusivos além de uma página e de um lote", async () => {
    const total = 1001;
    const memory = createMemory({
      users: [{ id: target, tier: "common_user" }],
      books: Array.from({ length: total }, (_, index) => ({
        id: `book-${String(index).padStart(4, "0")}`,
        chosen_by: target,
        user_id: target,
        readers: [target],
      })),
    });

    const result = await deleteReaderAccount(memory.client, target);
    const bookDeletes = memory.inCalls.filter(
      (call) => call.table === "books" && call.column === "id",
    );

    expect(result).toEqual({ error: null });
    expect(memory.tables.books).toEqual([]);
    expect(memory.authDeleted).toEqual([target]);
    expect(memory.tables.users).toEqual([]);
    expect(bookDeletes.map((call) => call.size)).toEqual([
      100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 1,
    ]);
  });

  it("não apaga nada quando a busca por responsabilidade falha", async () => {
    const memory = createMemory(library().tables, {
      table: "books",
      action: "select",
      call: 1,
    });

    const result = await deleteReaderAccount(memory.client, target);

    expect(result.error).toBe("select failed");
    expect(memory.authDeleted).toEqual([]);
    expect(memory.inCalls).toEqual([]);
    expect(memory.tables.books.map((row) => row.id)).toEqual([
      "book-exclusive",
      "book-collective",
      "book-joined",
    ]);
    expect(memory.tables.users.map((row) => row.id)).toContain(target);
  });

  it("não apaga nada quando a busca por quem cadastrou falha", async () => {
    const memory = createMemory(library().tables, {
      table: "books",
      action: "select",
      column: "user_id",
    });

    const result = await deleteReaderAccount(memory.client, target);

    expect(result.error).toBe("select failed");
    expect(memory.authDeleted).toEqual([]);
    expect(memory.inCalls).toEqual([]);
    expect(memory.tables.books).toEqual(library().tables.books);
    expect(memory.tables.users.map((row) => row.id)).toContain(target);
  });

  it("não apaga nada quando a página seguinte da busca falha", async () => {
    const total = 1001;
    const memory = createMemory(
      {
        users: [{ id: target, tier: "common_user" }],
        books: Array.from({ length: total }, (_, index) => ({
          id: `book-${String(index).padStart(4, "0")}`,
          chosen_by: target,
          user_id: target,
          readers: [target],
        })),
      },
      { table: "books", action: "select", call: 2 },
    );

    const result = await deleteReaderAccount(memory.client, target);

    expect(result.error).toBe("select failed");
    expect(memory.authDeleted).toEqual([]);
    expect(memory.inCalls).toEqual([]);
    expect(memory.tables.books).toHaveLength(total);
    expect(memory.tables.users.map((row) => row.id)).toEqual([target]);
  });

  it("interrompe o lote e preserva o login quando apagar os livros falha", async () => {
    const total = 250;
    const memory = createMemory(
      {
        users: [{ id: target, tier: "common_user" }],
        books: Array.from({ length: total }, (_, index) => ({
          id: `book-${String(index).padStart(4, "0")}`,
          chosen_by: target,
          user_id: target,
          readers: [target],
        })),
        quotes: [
          { id: "q-first", book_id: "book-0000" },
          { id: "q-later", book_id: "book-0100" },
        ],
      },
      { table: "books", action: "delete", call: 2 },
    );

    const result = await deleteReaderAccount(memory.client, target);
    const bookDeletes = memory.inCalls.filter(
      (call) => call.table === "books" && call.column === "id",
    );

    expect(result.error).toBe("fk violation");
    expect(memory.authDeleted).toEqual([]);
    expect(bookDeletes.map((call) => call.size)).toEqual([100, 100]);
    expect(memory.tables.books).toHaveLength(150);
    expect(memory.tables.books.map((row) => row.id)).not.toContain("book-0000");
    expect(memory.tables.books.map((row) => row.id)).toContain("book-0100");
    expect(memory.tables.books.map((row) => row.id)).toContain("book-0249");
    expect(memory.tables.quotes).toEqual([]);
    expect(memory.tables.users.map((row) => row.id)).toEqual([target]);
  });

  it("não remove o login quando a busca das estantes falha", async () => {
    const memory = createMemory(library().tables, {
      table: "custom_shelves",
      action: "select",
    });

    const result = await deleteReaderAccount(memory.client, target);

    expect(result.error).toBe("select failed");
    expect(memory.authDeleted).toEqual([]);
    expect(memory.tables.users.map((row) => row.id)).toContain(target);
    expect(memory.tables.books.map((row) => row.id)).not.toContain(
      "book-exclusive",
    );
    expect(memory.tables.custom_shelves.map((row) => row.id)).toEqual([
      "shelf-target",
      "shelf-other",
    ]);
    expect(memory.tables.custom_shelf_books.map((row) => row.id)).toEqual([
      "link-2",
      "link-4",
    ]);
  });

  it("não remove o login quando a limpeza das notificações falha", async () => {
    const memory = createMemory(library().tables, {
      table: "notifications",
      action: "delete",
    });

    const result = await deleteReaderAccount(memory.client, target);

    expect(result.error).toBe("fk violation");
    expect(memory.authDeleted).toEqual([]);
    expect(memory.tables.users.map((row) => row.id)).toContain(target);
    expect(memory.tables.notifications.map((row) => row.id)).toEqual([
      "n-actor",
      "n-recipient",
      "n-kept",
    ]);
    expect(memory.tables.register_invites.map((row) => row.id)).toContain(
      "invite-target",
    );
    expect(memory.tables.registration_settings).toEqual([
      { id: "settings", updated_by: target },
    ]);
  });

  it("não remove o login quando o perfil não sai", async () => {
    const memory = createMemory(library().tables, {
      table: "users",
      action: "delete",
    });

    const result = await deleteReaderAccount(memory.client, target);

    expect(result.error).toBe("fk violation");
    expect(memory.authDeleted).toEqual([]);
    expect(memory.tables.users.map((row) => row.id)).toEqual([
      target,
      other,
      witness,
    ]);
    expect(memory.tables.register_invites.map((row) => row.id)).toEqual([
      "invite-other",
    ]);
    expect(memory.tables.registration_settings).toEqual([
      { id: "settings", updated_by: null },
    ]);
  });

  it("apaga estantes além de uma página e ignora id vazio", async () => {
    const total = 1001;
    const memory = createMemory({
      users: [
        { id: target, tier: "common_user" },
        { id: other, tier: "common_user" },
      ],
      custom_shelves: [
        ...Array.from({ length: total }, (_, index) => ({
          id: `shelf-${String(index).padStart(4, "0")}`,
          user_id: target,
        })),
        { id: "", user_id: target },
        { id: 404, user_id: target },
        { id: "shelf-other", user_id: other },
      ],
      custom_shelf_books: [
        ...Array.from({ length: total }, (_, index) => ({
          id: `link-${String(index).padStart(4, "0")}`,
          shelf_id: `shelf-${String(index).padStart(4, "0")}`,
          book_id: "kept",
        })),
        { id: "link-blank", shelf_id: "", book_id: "kept" },
        { id: "link-numeric", shelf_id: 404, book_id: "kept" },
        { id: "link-other", shelf_id: "shelf-other", book_id: "kept" },
      ],
    });

    const result = await deleteReaderAccount(memory.client, target);
    const shelfDeletes = memory.inCalls.filter(
      (call) =>
        call.table === "custom_shelf_books" && call.column === "shelf_id",
    );

    expect(result).toEqual({ error: null });
    expect(memory.authDeleted).toEqual([target]);
    expect(memory.tables.users.map((row) => row.id)).toEqual([other]);
    expect(memory.tables.custom_shelves).toEqual([
      { id: "shelf-other", user_id: other },
    ]);
    expect(memory.tables.custom_shelf_books.map((row) => row.id)).toEqual([
      "link-blank",
      "link-numeric",
      "link-other",
    ]);
    expect(shelfDeletes.map((call) => call.size)).toEqual([
      100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 1,
    ]);
  });
});
