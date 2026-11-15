import { describe, expect, it, vi } from "vitest";

import {
  deleteReaderAccount,
  partitionReaderBooks,
  type ReaderBookRow,
  type ReaderDeletionClient,
} from "./deleteReaderAccount";

const target = "user-target";
const other = "user-other";
const later = "user-later";
const dead = "user-deleted";
const living = new Set([target, other, later]);

function client(options: {
  cascadeError?: { message: string; status?: number } | null;
  authError?: { message: string; status?: number; code?: string } | null;
}): ReaderDeletionClient & { authDeletes: string[] } {
  const authDeletes: string[] = [];
  return {
    authDeletes,
    rpc: vi.fn().mockResolvedValue({ error: options.cascadeError ?? null }),
    from: () => {
      throw new Error("a consulta ao banco não deveria acontecer");
    },
    auth: {
      admin: {
        deleteUser: vi.fn(async (userId: string) => {
          authDeletes.push(userId);
          return { error: options.authError ?? null };
        }),
      },
    },
  };
}

const MISSING_CASCADE =
  "Could not find the function public.delete_reader_cascade(p_user_id) in the schema cache";

type MemoryRow = Record<string, unknown>;
type MemoryTables = Record<string, MemoryRow[]>;

type InCall = {
  table: string;
  column: string;
  values: string[];
};

function fallbackService(options: {
  tables: MemoryTables;
  message?: string;
  authError?: { message: string; status?: number; code?: string } | null;
  adminCount?: number | null;
  adminCountError?: string;
  failProfile?: boolean;
  failDelete?: { table: string; message: string };
  failRange?: { table: string; call: number; message: string };
}): ReaderDeletionClient & { authDeletes: string[]; inCalls: InCall[] } {
  const authDeletes: string[] = [];
  const inCalls: InCall[] = [];
  const rangeCalls = new Map<string, number>();

  function rows(table: string): MemoryRow[] {
    if (!options.tables[table]) options.tables[table] = [];
    return options.tables[table];
  }

  function page(table: string, matched: MemoryRow[], from: number, to: number) {
    const call = (rangeCalls.get(table) ?? 0) + 1;
    rangeCalls.set(table, call);
    if (
      options.failRange?.table === table &&
      options.failRange.call === call
    ) {
      return Promise.resolve({
        data: null,
        error: { message: options.failRange.message },
      });
    }
    return Promise.resolve({
      data: matched.slice(from, to + 1),
      error: null,
    });
  }

  function contained(row: MemoryRow, column: string, values: string[]) {
    const current = row[column];
    return (
      Array.isArray(current) && values.every((item) => current.includes(item))
    );
  }

  return {
    authDeletes,
    inCalls,
    rpc: vi.fn().mockResolvedValue({
      error: { message: options.message ?? MISSING_CASCADE },
    }),
    from(table: string) {
      return {
        select(columns: string, query?: { head?: boolean }) {
          const matchedResult = (matched: MemoryRow[]) => {
            if (query?.head) {
              return Promise.resolve({
                data: null,
                error: options.adminCountError
                  ? { message: options.adminCountError }
                  : null,
                count:
                  options.adminCount === undefined
                    ? matched.length
                    : options.adminCount,
              });
            }
            return {
              order: () => ({
                range: (from: number, to: number) =>
                  page(table, matched, from, to),
              }),
              maybeSingle: () => {
                if (options.failProfile && columns === "id, tier") {
                  return Promise.resolve({
                    data: null,
                    error: { message: "perfil ilegível" },
                  });
                }
                return Promise.resolve({
                  data: matched[0] ?? null,
                  error: null,
                });
              },
            };
          };
          return {
            eq: (column: string, value: string) =>
              matchedResult(
                rows(table).filter((row) => row[column] === value),
              ),
            contains: (column: string, values: string[]) => ({
              order: () => ({
                range: (from: number, to: number) =>
                  page(
                    table,
                    rows(table).filter((row) =>
                      contained(row, column, values),
                    ),
                    from,
                    to,
                  ),
              }),
            }),
            order: () => ({
              range: (from: number, to: number) =>
                page(table, rows(table), from, to),
            }),
          };
        },
        delete: () => ({
          eq: (column: string, value: string) => {
            if (options.failDelete?.table === table) {
              return Promise.resolve({
                error: { message: options.failDelete.message },
              });
            }
            options.tables[table] = rows(table).filter(
              (row) => row[column] !== value,
            );
            return Promise.resolve({ error: null });
          },
          in: (column: string, values: string[]) => {
            inCalls.push({ table, column, values: [...values] });
            if (options.failDelete?.table === table) {
              return Promise.resolve({
                error: { message: options.failDelete.message },
              });
            }
            options.tables[table] = rows(table).filter(
              (row) => !values.includes(String(row[column])),
            );
            return Promise.resolve({ error: null });
          },
        }),
        update: (values: MemoryRow) => ({
          eq: (column: string, value: string) => {
            if (options.failDelete?.table === table) {
              return Promise.resolve({
                error: { message: options.failDelete.message },
              });
            }
            options.tables[table] = rows(table).map((row) =>
              row[column] === value ? { ...row, ...values } : row,
            );
            return Promise.resolve({ error: null });
          },
        }),
      };
    },
    auth: {
      admin: {
        deleteUser: vi.fn(async (userId: string) => {
          authDeletes.push(userId);
          return { error: options.authError ?? null };
        }),
      },
    },
  };
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

    expect(partitionReaderBooks(books, target, living)).toEqual({
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

  it("preserva o livro quando o outro participante está só em user_id", () => {
    const books: ReaderBookRow[] = [
      {
        id: "registered-by-other",
        chosen_by: target,
        user_id: other,
        readers: [target],
      },
    ];

    expect(partitionReaderBooks(books, target, living)).toEqual({
      deleteIds: [],
      detach: [
        {
          id: "registered-by-other",
          chosen_by: other,
          user_id: other,
          readers: [],
        },
      ],
    });
  });

  it("passa a responsabilidade ao leitor vivo que vem depois de um id morto", () => {
    const books: ReaderBookRow[] = [
      {
        id: "stale-then-living",
        chosen_by: target,
        user_id: target,
        readers: [dead, later, other],
      },
    ];

    expect(partitionReaderBooks(books, target, living)).toEqual({
      deleteIds: [],
      detach: [
        {
          id: "stale-then-living",
          chosen_by: later,
          user_id: null,
          readers: [later, other],
        },
      ],
    });
  });

  it("apaga o livro exclusivo quando os outros ids de readers já não existem", () => {
    const books: ReaderBookRow[] = [
      {
        id: "only-ghosts",
        chosen_by: target,
        user_id: dead,
        readers: [target, dead, dead],
      },
    ];

    expect(partitionReaderBooks(books, target, living)).toEqual({
      deleteIds: ["only-ghosts"],
      detach: [],
    });
  });

  it("mantém o livro pelo user_id vivo e descarta readers mortos", () => {
    const books: ReaderBookRow[] = [
      {
        id: "registered-with-ghosts",
        chosen_by: target,
        user_id: other,
        readers: [target, dead, dead],
      },
    ];

    expect(partitionReaderBooks(books, target, living)).toEqual({
      deleteIds: [],
      detach: [
        {
          id: "registered-with-ghosts",
          chosen_by: other,
          user_id: other,
          readers: [],
        },
      ],
    });
  });

  it("não promove um chosen_by que já não existe", () => {
    const books: ReaderBookRow[] = [
      {
        id: "dead-owner",
        chosen_by: dead,
        user_id: null,
        readers: [target, dead, later],
      },
    ];

    expect(partitionReaderBooks(books, target, living)).toEqual({
      deleteIds: [],
      detach: [
        {
          id: "dead-owner",
          chosen_by: later,
          user_id: null,
          readers: [later],
        },
      ],
    });
  });

  it("tira ids mortos da lista e não usa user_id ausente como participante", () => {
    const books: ReaderBookRow[] = [
      {
        id: "shared-with-ghosts",
        chosen_by: other,
        user_id: dead,
        readers: [dead, target, other, dead],
      },
    ];

    expect(partitionReaderBooks(books, target, living)).toEqual({
      deleteIds: [],
      detach: [
        {
          id: "shared-with-ghosts",
          chosen_by: other,
          user_id: null,
          readers: [other],
        },
      ],
    });
  });
});

describe("deleteReaderAccount", () => {
  it("chama a cascata no banco e depois remove o login", async () => {
    const service = client({});
    const result = await deleteReaderAccount(service, target);

    expect(result).toEqual({ error: null, status: 200 });
    expect(service.rpc).toHaveBeenCalledWith("delete_reader_cascade", {
      p_user_id: target,
    });
    expect(service.authDeletes).toEqual([target]);
  });

  it("não remove o login quando ainda é o último admin", async () => {
    const service = client({
      cascadeError: { message: "Não é possível excluir o último admin." },
    });

    const result = await deleteReaderAccount(service, target);

    expect(service.rpc).toHaveBeenCalledWith("delete_reader_cascade", {
      p_user_id: target,
    });
    expect(service.authDeletes).toEqual([]);
    expect(result).toEqual({
      error: "Não é possível excluir o último admin.",
      status: 409,
    });
  });

  it("conclui o login quando o perfil já foi removido", async () => {
    const service = client({
      cascadeError: { message: "Usuário não encontrado." },
    });

    const result = await deleteReaderAccount(service, target);

    expect(result).toEqual({ error: null, status: 200 });
    expect(service.authDeletes).toEqual([target]);
  });

  it("retorna 404 quando perfil e login já não existem", async () => {
    const service = client({
      cascadeError: { message: "Usuário não encontrado." },
      authError: { message: "User not found", status: 404 },
    });

    const result = await deleteReaderAccount(service, target);

    expect(service.authDeletes).toEqual([target]);
    expect(result).toEqual({
      error: "Usuário não encontrado.",
      status: 404,
    });
  });

  it("trata o código user_not_found como login ausente", async () => {
    const service = client({
      cascadeError: { message: "Usuário não encontrado." },
      authError: {
        message: "Not Found",
        status: 404,
        code: "user_not_found",
      },
    });

    const result = await deleteReaderAccount(service, target);

    expect(service.authDeletes).toEqual([target]);
    expect(result).toEqual({
      error: "Usuário não encontrado.",
      status: 404,
    });
  });

  it("pede nova tentativa quando o 404 do login não é um usuário ausente", async () => {
    const service = client({
      authError: { message: "Not Found", status: 404 },
    });

    const result = await deleteReaderAccount(service, target);

    expect(service.authDeletes).toEqual([target]);
    expect(result.status).toBe(500);
    expect(result.error).toContain("login");
  });

  it("pede nova tentativa quando o perfil já saiu e o 404 do login é genérico", async () => {
    const service = client({
      cascadeError: { message: "Usuário não encontrado." },
      authError: { message: "Not Found", status: 404 },
    });

    const result = await deleteReaderAccount(service, target);

    expect(service.authDeletes).toEqual([target]);
    expect(result.status).toBe(500);
    expect(result.error).toContain("login");
  });

  it("mantém a tentativa quando a remoção do login falha", async () => {
    const service = client({
      authError: { message: "auth down", status: 500 },
    });

    const result = await deleteReaderAccount(service, target);

    expect(result.status).toBe(500);
    expect(result.error).toContain("login");
    expect(service.authDeletes).toEqual([target]);
  });

  it("exclui pela aplicação quando a função ainda não existe no banco", async () => {
    const tables: Record<string, Array<Record<string, unknown>>> = {
      users: [
        { id: target, tier: "common_user" },
        { id: other, tier: "common_user" },
      ],
      books: [
        {
          id: "solo",
          chosen_by: target,
          user_id: target,
          readers: [target],
        },
        {
          id: "shared",
          chosen_by: target,
          user_id: other,
          readers: [target, other],
        },
      ],
      quotes: [
        { id: "q-solo", book_id: "solo" },
        { id: "q-shared", book_id: "shared" },
      ],
    };
    const authDeletes: string[] = [];

    function rows(table: string) {
      if (!tables[table]) tables[table] = [];
      return tables[table];
    }

    const service: ReaderDeletionClient & { authDeletes: string[] } = {
      authDeletes,
      rpc: vi.fn().mockResolvedValue({
        error: {
          message:
            "Could not find the function public.delete_reader_cascade(p_user_id) in the schema cache",
        },
      }),
      from(table: string) {
        return {
          select(columns: string, options?: { head?: boolean }) {
            const run = (matched: Array<Record<string, unknown>>) => {
              if (options?.head) {
                return Promise.resolve({
                  data: null,
                  error: null,
                  count: matched.length,
                });
              }
              if (columns === "id, tier") {
                return {
                  maybeSingle: () =>
                    Promise.resolve({
                      data: matched[0] ?? null,
                      error: null,
                    }),
                };
              }
              return {
                order: () => ({
                  range: () =>
                    Promise.resolve({ data: matched, error: null }),
                }),
                maybeSingle: () =>
                  Promise.resolve({
                    data: matched[0] ?? null,
                    error: null,
                  }),
              };
            };
            return {
              eq: (column: string, value: string) =>
                run(rows(table).filter((row) => row[column] === value)),
              contains: (column: string, values: string[]) => ({
                order: () => ({
                  range: () =>
                    Promise.resolve({
                      data: rows(table).filter((row) => {
                        const current = row[column];
                        return (
                          Array.isArray(current) &&
                          values.every((item) => current.includes(item))
                        );
                      }),
                      error: null,
                    }),
                }),
              }),
              order: () => ({
                range: () => Promise.resolve({ data: rows(table), error: null }),
              }),
            };
          },
          delete: () => ({
            eq: (column: string, value: string) => {
              tables[table] = rows(table).filter((row) => row[column] !== value);
              return Promise.resolve({ error: null });
            },
            in: (column: string, values: string[]) => {
              tables[table] = rows(table).filter(
                (row) => !values.includes(String(row[column])),
              );
              return Promise.resolve({ error: null });
            },
          }),
          update: (values: Record<string, unknown>) => ({
            eq: (column: string, value: string) => {
              tables[table] = rows(table).map((row) =>
                row[column] === value ? { ...row, ...values } : row,
              );
              return Promise.resolve({ error: null });
            },
          }),
        };
      },
      auth: {
        admin: {
          deleteUser: vi.fn(async (userId: string) => {
            authDeletes.push(userId);
            return { error: null };
          }),
        },
      },
    };

    const result = await deleteReaderAccount(
      service as unknown as ReaderDeletionClient,
      target,
    );

    expect(result).toEqual({ error: null, status: 200 });
    expect(service.rpc).toHaveBeenCalledWith("delete_reader_cascade", {
      p_user_id: target,
    });
    expect(tables.users.map((row) => row.id)).toEqual([other]);
    expect(tables.books).toEqual([
      {
        id: "shared",
        chosen_by: other,
        user_id: other,
        readers: [other],
      },
    ]);
    expect(tables.quotes).toEqual([{ id: "q-shared", book_id: "shared" }]);
    expect(authDeletes).toEqual([target]);
  });

  it("não consulta as tabelas quando a função falha por outro motivo", async () => {
    const service = client({
      cascadeError: {
        message: "permission denied for function delete_reader_cascade",
      },
    });

    const result = await deleteReaderAccount(service, target);

    expect(result).toEqual({
      error: "permission denied for function delete_reader_cascade",
      status: 500,
    });
    expect(service.authDeletes).toEqual([]);
  });

  it("não consulta as tabelas quando falta outra função", async () => {
    const service = client({
      cascadeError: {
        message: "Could not find the function public.list_books()",
      },
    });

    const result = await deleteReaderAccount(service, target);

    expect(result).toEqual({
      error: "Could not find the function public.list_books()",
      status: 500,
    });
    expect(service.authDeletes).toEqual([]);
  });

  it("aceita o aviso da função ausente sem citar o schema cache", async () => {
    const tables: MemoryTables = {
      users: [{ id: target, tier: "common_user" }],
    };
    const service = fallbackService({
      tables,
      message: "Could not find the function DELETE_READER_CASCADE",
    });

    const result = await deleteReaderAccount(service, target);

    expect(result).toEqual({ error: null, status: 200 });
    expect(tables.users).toEqual([]);
    expect(service.authDeletes).toEqual([target]);
  });

  it("não exclui o último admin quando a função não existe", async () => {
    const tables: MemoryTables = {
      users: [
        { id: target, tier: "admin" },
        { id: other, tier: "common_user" },
      ],
      books: [
        {
          id: "solo",
          chosen_by: target,
          user_id: target,
          readers: [target],
        },
      ],
    };
    const service = fallbackService({ tables });

    const result = await deleteReaderAccount(service, target);

    expect(result).toEqual({
      error: "Não é possível excluir o último admin.",
      status: 409,
    });
    expect(service.authDeletes).toEqual([]);
    expect(tables.users).toHaveLength(2);
    expect(tables.books).toHaveLength(1);
  });

  it("não exclui o admin quando a contagem não vem", async () => {
    const tables: MemoryTables = {
      users: [
        { id: target, tier: "admin" },
        { id: other, tier: "admin" },
      ],
      books: [
        {
          id: "solo",
          chosen_by: target,
          user_id: target,
          readers: [target],
        },
      ],
    };
    const service = fallbackService({ tables, adminCount: null });

    const result = await deleteReaderAccount(service, target);

    expect(result).toEqual({
      error: "Não é possível excluir o último admin.",
      status: 409,
    });
    expect(service.authDeletes).toEqual([]);
    expect(tables.books).toHaveLength(1);
  });

  it("exclui um admin quando ainda existe outro", async () => {
    const tables: MemoryTables = {
      users: [
        { id: target, tier: "admin" },
        { id: other, tier: "admin" },
      ],
      books: [
        {
          id: "solo",
          chosen_by: target,
          user_id: target,
          readers: [target],
        },
      ],
    };
    const service = fallbackService({ tables });

    const result = await deleteReaderAccount(service, target);

    expect(result).toEqual({ error: null, status: 200 });
    expect(tables.users).toEqual([{ id: other, tier: "admin" }]);
    expect(tables.books).toEqual([]);
    expect(service.authDeletes).toEqual([target]);
  });

  it("não exclui ninguém quando a contagem de admins falha", async () => {
    const tables: MemoryTables = {
      users: [
        { id: target, tier: "admin" },
        { id: other, tier: "admin" },
      ],
      books: [
        {
          id: "solo",
          chosen_by: target,
          user_id: target,
          readers: [target],
        },
      ],
    };
    const service = fallbackService({
      tables,
      adminCountError: "contagem indisponível",
    });

    const result = await deleteReaderAccount(service, target);

    expect(result).toEqual({ error: "contagem indisponível", status: 500 });
    expect(service.authDeletes).toEqual([]);
    expect(tables.users).toHaveLength(2);
    expect(tables.books).toHaveLength(1);
  });

  it("não remove o login quando a leitura do perfil falha", async () => {
    const tables: MemoryTables = {
      users: [{ id: target, tier: "common_user" }],
      user_followers: [
        { id: "link", follower_id: target, following_id: other },
      ],
    };
    const service = fallbackService({ tables, failProfile: true });

    const result = await deleteReaderAccount(service, target);

    expect(result).toEqual({ error: "perfil ilegível", status: 500 });
    expect(service.authDeletes).toEqual([]);
    expect(tables.users).toHaveLength(1);
    expect(tables.user_followers).toHaveLength(1);
  });

  it("conclui só o login quando o perfil já não existe", async () => {
    const tables: MemoryTables = {
      users: [{ id: other, tier: "common_user" }],
      user_followers: [
        { id: "link", follower_id: target, following_id: other },
      ],
      registration_settings: [{ id: "settings", updated_by: target }],
    };
    const service = fallbackService({ tables });

    const result = await deleteReaderAccount(service, target);

    expect(result).toEqual({ error: null, status: 200 });
    expect(service.authDeletes).toEqual([target]);
    expect(tables.users).toEqual([{ id: other, tier: "common_user" }]);
    expect(tables.user_followers).toEqual([
      { id: "link", follower_id: target, following_id: other },
    ]);
    expect(tables.registration_settings).toEqual([
      { id: "settings", updated_by: target },
    ]);
  });

  it("pede nova tentativa quando o perfil já saiu e o 404 do login é genérico na limpeza direta", async () => {
    const tables: MemoryTables = {
      users: [{ id: other, tier: "common_user" }],
      user_followers: [
        { id: "link", follower_id: target, following_id: other },
      ],
    };
    const service = fallbackService({
      tables,
      authError: { message: "Not Found", status: 404 },
    });

    const result = await deleteReaderAccount(service, target);

    expect(result.status).toBe(500);
    expect(result.error).toContain("login");
    expect(service.authDeletes).toEqual([target]);
    expect(tables.user_followers).toHaveLength(1);
  });

  it("interrompe a limpeza quando uma tabela do livro exclusivo falha", async () => {
    const shared = {
      id: "shared",
      chosen_by: target,
      user_id: other,
      readers: [target, other],
    };
    const tables: MemoryTables = {
      users: [
        { id: target, tier: "common_user" },
        { id: other, tier: "common_user" },
      ],
      books: [
        {
          id: "solo",
          chosen_by: target,
          user_id: target,
          readers: [target],
        },
        shared,
      ],
      quotes: [
        { id: "q-solo", book_id: "solo" },
        { id: "q-shared", book_id: "shared" },
      ],
    };
    const service = fallbackService({
      tables,
      failDelete: { table: "quotes", message: "quotes bloqueadas" },
    });

    const result = await deleteReaderAccount(service, target);

    expect(result).toEqual({ error: "quotes bloqueadas", status: 500 });
    expect(service.authDeletes).toEqual([]);
    expect(tables.users.map((row) => row.id)).toEqual([target, other]);
    expect(tables.books).toContainEqual(shared);
    expect(tables.quotes).toEqual([
      { id: "q-solo", book_id: "solo" },
      { id: "q-shared", book_id: "shared" },
    ]);
  });

  it("não promove id morto nem apaga o livro por um reader nulo", async () => {
    const tables: MemoryTables = {
      users: [
        { id: target, tier: "common_user" },
        { id: other, tier: "common_user" },
      ],
      books: [
        {
          id: "only-ghost",
          chosen_by: target,
          user_id: target,
          readers: [target, "ghost"],
        },
        {
          id: "null-partner",
          chosen_by: "ghost",
          user_id: target,
          readers: [target, null, other],
        },
        {
          id: "untouched",
          chosen_by: other,
          user_id: other,
          readers: [other],
        },
      ],
      quotes: [
        { id: "q-ghost", book_id: "only-ghost" },
        { id: "q-partner", book_id: "null-partner" },
      ],
    };
    const service = fallbackService({ tables });

    const result = await deleteReaderAccount(service, target);

    expect(result).toEqual({ error: null, status: 200 });
    expect(tables.books).toEqual([
      {
        id: "null-partner",
        chosen_by: other,
        user_id: null,
        readers: [other],
      },
      {
        id: "untouched",
        chosen_by: other,
        user_id: other,
        readers: [other],
      },
    ]);
    expect(tables.quotes).toEqual([
      { id: "q-partner", book_id: "null-partner" },
    ]);
    expect(service.authDeletes).toEqual([target]);
  });

  it("remove os dados do leitor e preserva os do outro", async () => {
    const tables: MemoryTables = {
      users: [
        { id: target, tier: "common_user" },
        { id: other, tier: "common_user" },
      ],
      books: [
        {
          id: "solo",
          chosen_by: target,
          user_id: target,
          readers: [target],
        },
        {
          id: "shared",
          chosen_by: other,
          user_id: other,
          readers: [target, other],
        },
      ],
      schedule: [
        { id: "sch-solo", book_id: "solo", owner: target },
        { id: "sch-shared-target", book_id: "shared", owner: target },
        { id: "sch-shared-other", book_id: "shared", owner: other },
      ],
      book_authors: [
        { id: "author-solo", book_id: "solo" },
        { id: "author-shared", book_id: "shared" },
      ],
      collective_reading_comment_reactions: [
        { id: "reaction-solo", book_id: "solo", user_id: other },
        { id: "reaction-shared", book_id: "shared", user_id: other },
        { id: "reaction-target", book_id: "shared", user_id: target },
      ],
      collective_reading_comments: [
        { id: "comment-shared", book_id: "shared", user_id: other },
        { id: "comment-target", book_id: "shared", user_id: target },
      ],
      user_book_favorites: [
        { id: "fav-target", book_id: "shared", user_id: target },
        { id: "fav-other", book_id: "shared", user_id: other },
      ],
      book_reading_ratings: [
        { id: "rate-target", book_id: "shared", user_id: target },
        { id: "rate-other", book_id: "shared", user_id: other },
      ],
      custom_shelves: [
        { id: "shelf-target", user_id: target },
        { id: "", user_id: target },
        { id: 12, user_id: target },
        { id: "shelf-other", user_id: other },
      ],
      custom_shelf_books: [
        { id: "link-target", shelf_id: "shelf-target", book_id: "shared" },
        { id: "link-blank", shelf_id: "", book_id: "shared" },
        { id: "link-number", shelf_id: 12, book_id: "shared" },
        { id: "link-other", shelf_id: "shelf-other", book_id: "shared" },
      ],
      user_followers: [
        { id: "out", follower_id: target, following_id: other },
        { id: "in", follower_id: other, following_id: target },
        { id: "kept", follower_id: other, following_id: later },
      ],
      user_notification_preferences: [
        { id: "pref-out", follower_id: target, following_id: other },
        { id: "pref-in", follower_id: other, following_id: target },
        { id: "pref-kept", follower_id: other, following_id: later },
      ],
      notifications: [
        { id: "n-rec", recipient_id: target, actor_id: other },
        { id: "n-act", recipient_id: other, actor_id: target },
        { id: "n-kept", recipient_id: other, actor_id: later },
      ],
      register_invites: [
        { id: "invite-target", created_by: target },
        { id: "invite-other", created_by: other },
      ],
      registration_settings: [
        { id: "settings-target", updated_by: target },
        { id: "settings-other", updated_by: other },
      ],
    };
    const service = fallbackService({ tables });

    const result = await deleteReaderAccount(service, target);

    expect(result).toEqual({ error: null, status: 200 });
    expect(tables.users).toEqual([{ id: other, tier: "common_user" }]);
    expect(tables.books).toEqual([
      {
        id: "shared",
        chosen_by: other,
        user_id: other,
        readers: [other],
      },
    ]);
    expect(tables.schedule).toEqual([
      { id: "sch-shared-other", book_id: "shared", owner: other },
    ]);
    expect(tables.book_authors).toEqual([
      { id: "author-shared", book_id: "shared" },
    ]);
    expect(tables.collective_reading_comment_reactions).toEqual([
      { id: "reaction-shared", book_id: "shared", user_id: other },
    ]);
    expect(tables.collective_reading_comments).toEqual([
      { id: "comment-shared", book_id: "shared", user_id: other },
    ]);
    expect(tables.user_book_favorites).toEqual([
      { id: "fav-other", book_id: "shared", user_id: other },
    ]);
    expect(tables.book_reading_ratings).toEqual([
      { id: "rate-other", book_id: "shared", user_id: other },
    ]);
    expect(tables.custom_shelves).toEqual([
      { id: "shelf-other", user_id: other },
    ]);
    expect(
      service.inCalls
        .filter((call) => call.column === "shelf_id")
        .flatMap((call) => call.values),
    ).toEqual(["shelf-target"]);
    expect(tables.custom_shelf_books).toEqual([
      { id: "link-blank", shelf_id: "", book_id: "shared" },
      { id: "link-number", shelf_id: 12, book_id: "shared" },
      { id: "link-other", shelf_id: "shelf-other", book_id: "shared" },
    ]);
    expect(tables.user_followers).toEqual([
      { id: "kept", follower_id: other, following_id: later },
    ]);
    expect(tables.user_notification_preferences).toEqual([
      { id: "pref-kept", follower_id: other, following_id: later },
    ]);
    expect(tables.notifications).toEqual([
      { id: "n-kept", recipient_id: other, actor_id: later },
    ]);
    expect(tables.register_invites).toEqual([
      { id: "invite-other", created_by: other },
    ]);
    expect(tables.registration_settings).toEqual([
      { id: "settings-target", updated_by: null },
      { id: "settings-other", updated_by: other },
    ]);
    expect(service.authDeletes).toEqual([target]);
  });

  it("apaga a segunda página de livros exclusivos em lotes de 100", async () => {
    const books = Array.from({ length: 1001 }, (_, index) => ({
      id: `book-${index}`,
      chosen_by: target,
      user_id: target,
      readers: [target],
    }));
    const tables: MemoryTables = {
      users: [
        { id: target, tier: "common_user" },
        { id: other, tier: "common_user" },
      ],
      books,
    };
    const service = fallbackService({ tables });

    const result = await deleteReaderAccount(service, target);

    const batches = service.inCalls
      .filter((call) => call.table === "books" && call.column === "id")
      .map((call) => call.values);
    expect(result).toEqual({ error: null, status: 200 });
    expect(batches.map((values) => values.length)).toEqual([
      100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 1,
    ]);
    expect(new Set(batches.flat()).size).toBe(1001);
    expect(tables.books).toEqual([]);
    expect(tables.users).toEqual([{ id: other, tier: "common_user" }]);
    expect(service.authDeletes).toEqual([target]);
  });

  it("não apaga o livro compartilhado quando a segunda página de usuários falha", async () => {
    const shared = {
      id: "shared",
      chosen_by: other,
      user_id: other,
      readers: [target, other],
    };
    const tables: MemoryTables = {
      users: [
        { id: target, tier: "common_user" },
        ...Array.from({ length: 999 }, (_, index) => ({
          id: `filler-${index}`,
          tier: "common_user",
        })),
        { id: other, tier: "common_user" },
      ],
      books: [shared],
    };
    const service = fallbackService({
      tables,
      failRange: {
        table: "users",
        call: 2,
        message: "página indisponível",
      },
    });

    const result = await deleteReaderAccount(service, target);

    expect(result).toEqual({ error: "página indisponível", status: 500 });
    expect(service.authDeletes).toEqual([]);
    expect(tables.books).toEqual([shared]);
    expect(tables.users.some((row) => row.id === target)).toBe(true);
  });
});
