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
  authError?: { message: string; status?: number } | null;
}): ReaderDeletionClient & { authDeletes: string[] } {
  const authDeletes: string[] = [];
  return {
    authDeletes,
    rpc: vi.fn().mockResolvedValue({ error: options.cascadeError ?? null }),
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

    expect(result).toEqual({
      error: "Não é possível excluir o último admin.",
      status: 409,
    });
    expect(service.authDeletes).toEqual([]);
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

    expect(result).toEqual({
      error: "Usuário não encontrado.",
      status: 404,
    });
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
});
