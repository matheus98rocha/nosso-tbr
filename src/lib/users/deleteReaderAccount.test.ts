import { describe, expect, it, vi } from "vitest";

import {
  deleteReaderAccount,
  partitionReaderBooks,
  type ReaderBookRow,
  type ReaderDeletionClient,
} from "./deleteReaderAccount";

const target = "user-target";
const other = "user-other";

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

  it("preserva o livro quando o outro participante está só em user_id", () => {
    const books: ReaderBookRow[] = [
      {
        id: "registered-by-other",
        chosen_by: target,
        user_id: other,
        readers: [target],
      },
    ];

    expect(partitionReaderBooks(books, target)).toEqual({
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
