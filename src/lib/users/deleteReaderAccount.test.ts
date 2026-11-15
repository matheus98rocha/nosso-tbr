import { describe, expect, it, vi } from "vitest";

import {
  deleteReaderAccount,
  partitionReaderBooks,
  type ReaderBookRow,
  type ReaderDeletionClient,
} from "./deleteReaderAccount";

const target = "user-target";
const other = "user-other";
const witness = "user-witness";

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
    expect(service.rpc).toHaveBeenCalledWith("delete_reader_cascade", {
      p_user_id: target,
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
    expect(service.authDeletes).toEqual([target]);
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
