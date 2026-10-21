import { describe, expect, it } from "vitest";
import { resolveAuthorListOrder } from "./authors.service";

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
