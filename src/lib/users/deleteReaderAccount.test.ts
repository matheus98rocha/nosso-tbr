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

    function whenAwaited(apply: () => void) {
      return {
        then(
          onFulfilled?: (value: { error: null }) => unknown,
          onRejected?: (reason: unknown) => unknown,
        ) {
          return Promise.resolve()
            .then(() => {
              apply();
              return { error: null as null };
            })
            .then(onFulfilled, onRejected);
        },
      };
    }

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
            eq: (column: string, value: string) =>
              whenAwaited(() => {
                tables[table] = rows(table).filter(
                  (row) => row[column] !== value,
                );
              }),
            in: (column: string, values: string[]) =>
              whenAwaited(() => {
                tables[table] = rows(table).filter(
                  (row) => !values.includes(String(row[column])),
                );
              }),
          }),
          update: (values: Record<string, unknown>) => ({
            eq: (column: string, value: string) =>
              whenAwaited(() => {
                tables[table] = rows(table).map((row) =>
                  row[column] === value ? { ...row, ...values } : row,
                );
              }),
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

  it("trata a exclusão como concluída quando o perfil sai e o login já não existe", async () => {
    const tables: Record<string, Array<Record<string, unknown>>> = {
      users: [{ id: target, tier: "common_user" }],
    };
    const service = client({
      cascadeError: {
        message:
          "Could not find the function public.delete_reader_cascade(p_user_id) in the schema cache",
      },
      authError: {
        message: "User not found",
        code: "user_not_found",
      },
    });
    service.from = (() => ({
      select: (columns: string, options?: { head?: boolean }) => ({
        eq: () => {
          if (options?.head) {
            return Promise.resolve({ data: null, error: null, count: 0 });
          }
          if (columns === "id, tier") {
            return {
              maybeSingle: () =>
                Promise.resolve({
                  data: tables.users[0] ?? null,
                  error: null,
                }),
            };
          }
          return {
            order: () => ({
              range: () => Promise.resolve({ data: tables.users, error: null }),
            }),
          };
        },
        contains: () => ({
          order: () => ({
            range: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
        order: () => ({
          range: () => Promise.resolve({ data: tables.users, error: null }),
        }),
      }),
      delete: () => ({
        eq: () => ({
          then: (
            onFulfilled?: (value: { error: null }) => unknown,
            onRejected?: (reason: unknown) => unknown,
          ) =>
            Promise.resolve()
              .then(() => {
                tables.users = [];
                return { error: null as null };
              })
              .then(onFulfilled, onRejected),
        }),
        in: () => Promise.resolve({ error: null }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    })) as ReaderDeletionClient["from"];

    const result = await deleteReaderAccount(service, target);

    expect(result).toEqual({ error: null, status: 200 });
    expect(service.authDeletes).toEqual([target]);
    expect(tables.users).toEqual([]);
  });
});
