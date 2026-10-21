import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiJson } from "@/lib/api/clientJsonFetch";

import { AuthorsService, resolveAuthorListOrder } from "./authors.service";

const { from } = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from }),
}));

vi.mock("@/lib/api/clientJsonFetch", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/clientJsonFetch")>(
    "@/lib/api/clientJsonFetch",
  );

  return {
    ...actual,
    apiJson: vi.fn(),
  };
});

type QueryResult = {
  data: unknown[] | null;
  error: { message: string } | null;
  count: number | null;
};

function createAuthorQuery(result: QueryResult) {
  const steps: string[] = [];
  const query = {
    select: vi.fn((columns: string, options?: { count?: string }) => {
      steps.push(`select:${columns}:${options?.count ?? ""}`);
      return query;
    }),
    order: vi.fn((column: string, options: { ascending: boolean }) => {
      steps.push(`order:${column}:${options.ascending}`);
      return query;
    }),
    ilike: vi.fn((column: string, pattern: string) => {
      steps.push(`ilike:${column}:${pattern}`);
      return query;
    }),
    range: vi.fn((start: number, end: number) => {
      steps.push(`range:${start}:${end}`);
      return Promise.resolve(result);
    }),
  };

  return { query, steps };
}

describe("resolveAuthorListOrder", () => {
  it("ordena por created_at ascendente quando não há coluna", () => {
    expect(resolveAuthorListOrder(undefined, undefined, true)).toEqual({
      column: "created_at",
      ascending: true,
    });
  });

  it("mapeia nome e livros para as colunas da listagem", () => {
    expect(resolveAuthorListOrder("name", false, true)).toEqual({
      column: "name",
      ascending: false,
    });
    expect(resolveAuthorListOrder("totalBooks", true, true)).toEqual({
      column: "total_books",
      ascending: true,
    });
    expect(resolveAuthorListOrder("createdAt", false, true)).toEqual({
      column: "created_at",
      ascending: false,
    });
  });

  it("não pede total_books na tabela authors", () => {
    expect(resolveAuthorListOrder("totalBooks", false, false)).toEqual({
      column: "created_at",
      ascending: false,
    });
  });

  it("ignora coluna fora da whitelist", () => {
    expect(resolveAuthorListOrder("actions", true, true)).toEqual({
      column: "created_at",
      ascending: true,
    });
  });
});

describe("AuthorsService.getAuthors", () => {
  beforeEach(() => {
    from.mockReset();
  });

  it("ordena o conjunto inteiro antes de paginar e mantém a ordem recebida", async () => {
    const { query, steps } = createAuthorQuery({
      data: [
        {
          id: "2",
          name: "Zélia",
          created_at: "2020-01-01",
          total_books: 4,
        },
        {
          id: "9",
          name: "Ana",
          created_at: "2024-01-01",
          total_books: 1,
        },
      ],
      error: null,
      count: 42,
    });
    from.mockReturnValue(query);

    const page = await new AuthorsService().getAuthors({
      withCountBooks: true,
      page: 3,
      pageSize: 10,
      searchName: "Ana",
      sortBy: "name",
      sortAscending: false,
    });

    expect(from).toHaveBeenCalledWith("authors_with_counts");
    expect(steps).toEqual([
      "select:*:exact",
      "order:name:false",
      "order:id:true",
      "ilike:name:%Ana%",
      "range:30:39",
    ]);
    expect(page).toEqual({
      data: [
        {
          id: "2",
          name: "Zélia",
          createdAt: "2020-01-01",
          totalBooks: 4,
        },
        {
          id: "9",
          name: "Ana",
          createdAt: "2024-01-01",
          totalBooks: 1,
        },
      ],
      total: 42,
    });
  });

  it("não pede total_books na tabela authors e ignora busca em branco", async () => {
    const { query, steps } = createAuthorQuery({
      data: null,
      error: null,
      count: null,
    });
    from.mockReturnValue(query);

    const page = await new AuthorsService().getAuthors({
      withCountBooks: false,
      sortBy: "totalBooks",
      sortAscending: false,
      searchName: "   ",
    });

    expect(from).toHaveBeenCalledWith("authors");
    expect(steps).toEqual([
      "select:*:exact",
      "order:created_at:false",
      "order:id:true",
      "range:0:9",
    ]);
    expect(page).toEqual({ data: [], total: 0 });
  });

  it("propaga falha da consulta sem devolver uma página", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { query } = createAuthorQuery({
      data: [{ id: "1", name: "Ana", created_at: "2020-01-01" }],
      error: { message: "permission denied" },
      count: 1,
    });
    from.mockReturnValue(query);

    await expect(new AuthorsService().getAuthors({})).rejects.toMatchObject({
      message: "Falha ao buscar Autores",
    });
  });
});

describe("AuthorsService create and edit", () => {
  beforeEach(() => {
    vi.mocked(apiJson).mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("entrega a mensagem de nome duplicado na criação", async () => {
    vi.mocked(apiJson).mockRejectedValue(
      new ApiError("Já existe um autor com esse nome.", 409),
    );

    await expect(new AuthorsService().createAuthor("Ana")).rejects.toMatchObject({
      message: "Já existe um autor com esse nome.",
    });
  });

  it("recusa criação sem o autor gravado", async () => {
    vi.mocked(apiJson).mockResolvedValue(null);

    await expect(new AuthorsService().createAuthor("Ana")).rejects.toMatchObject({
      message: "Autor criado, mas dados não retornados.",
    });
  });

  it("entrega a mensagem de nome duplicado na edição", async () => {
    vi.mocked(apiJson).mockRejectedValue(
      new ApiError("Já existe um autor com esse nome.", 409),
    );

    await expect(
      new AuthorsService().editAuthor("Ana", "auth-1"),
    ).rejects.toMatchObject({
      message: "Já existe um autor com esse nome.",
    });
    expect(apiJson).toHaveBeenCalledWith(
      "/api/authors/auth-1",
      expect.objectContaining({ method: "PATCH" }),
    );
  });
});
