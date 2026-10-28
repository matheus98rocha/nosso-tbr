import { describe, expect, it } from "vitest";

import { resolveBookAuthors } from "./resolveBookAuthors";

describe("resolveBookAuthors", () => {
  it("usa book_authors como fonte de verdade e formata com formatList", () => {
    const result = resolveBookAuthors({
      author_id: "legacy-only",
      author: { name: "Legacy" },
      book_authors: [
        { author_id: "a1", authors: { name: "Ana" } },
        { author_id: "a2", authors: { name: "Bruno" } },
        { author_id: "a3", authors: { name: "Carla" } },
      ],
    });

    expect(result.authorIds).toEqual(["a1", "a2", "a3"]);
    expect(result.authorNames).toEqual(["Ana", "Bruno", "Carla"]);
    expect(result.authorDisplay).toBe("Ana, Bruno e Carla");
    expect(result.primaryAuthorId).toBe("a1");
  });

  it("prefere credited_authors quando o filtro embutido reduz book_authors", () => {
    const result = resolveBookAuthors({
      author_id: "a1",
      author: { name: "Ana" },
      book_authors: [{ author_id: "a1", authors: { name: "Ana" } }],
      credited_authors: [
        { author_id: "a1", authors: { name: "Ana" } },
        { author_id: "a2", authors: { name: "Bruno" } },
      ],
    });

    expect(result.authorIds).toEqual(["a1", "a2"]);
    expect(result.authorNames).toEqual(["Ana", "Bruno"]);
    expect(result.authorDisplay).toBe("Ana e Bruno");
    expect(result.primaryAuthorId).toBe("a1");
  });

  it("formata dois autores com e", () => {
    const result = resolveBookAuthors({
      book_authors: [
        { author_id: "a1", authors: { name: "Ana" } },
        { author_id: "a2", authors: { name: "Bruno" } },
      ],
    });

    expect(result.authorDisplay).toBe("Ana e Bruno");
  });

  it("faz fallback para author_id legado quando book_authors está vazio", () => {
    const result = resolveBookAuthors({
      author_id: "legacy-1",
      author: { name: "Machado" },
      book_authors: [],
    });

    expect(result.authorIds).toEqual(["legacy-1"]);
    expect(result.authorDisplay).toBe("Machado");
    expect(result.primaryAuthorId).toBe("legacy-1");
  });

  it("retorna Autor desconhecido sem vínculos nem legado", () => {
    const result = resolveBookAuthors({
      author_id: null,
      author: null,
      book_authors: null,
    });

    expect(result.authorIds).toEqual([]);
    expect(result.authorDisplay).toBe("Autor desconhecido");
    expect(result.primaryAuthorId).toBeUndefined();
  });

  it("ignora credited_authors vazio e usa a lista completa de book_authors", () => {
    const result = resolveBookAuthors({
      book_authors: [
        { author_id: "a1", authors: { name: "Ana" } },
        { author_id: "a2", authors: { name: "Bruno" } },
      ],
      credited_authors: [],
    });

    expect(result.authorIds).toEqual(["a1", "a2"]);
    expect(result.authorDisplay).toBe("Ana e Bruno");
  });

  it("mantém o id quando o vínculo não traz nome", () => {
    const result = resolveBookAuthors({
      book_authors: [
        { author_id: " a1 ", authors: { name: "  " } },
        { author_id: "a2", author: { name: "Bruno" } },
      ],
    });

    expect(result.authorIds).toEqual(["a1", "a2"]);
    expect(result.authorNames).toEqual(["Bruno"]);
    expect(result.authorDisplay).toBe("Bruno");
    expect(result.primaryAuthorId).toBe("a1");
  });

  it("mostra Autor desconhecido quando todo vínculo tem id e nome vazio", () => {
    const result = resolveBookAuthors({
      book_authors: [{ author_id: "a1", authors: { name: null } }],
    });

    expect(result.authorIds).toEqual(["a1"]);
    expect(result.authorNames).toEqual([]);
    expect(result.authorDisplay).toBe("Autor desconhecido");
    expect(result.primaryAuthorId).toBe("a1");
  });

  it("descarta vínculos sem id e volta ao autor legado", () => {
    const result = resolveBookAuthors({
      author_id: " legacy ",
      author: { name: " Machado " },
      book_authors: [{ author_id: "  ", authors: { name: "Fantasma" } }],
    });

    expect(result.authorIds).toEqual(["legacy"]);
    expect(result.authorNames).toEqual(["Machado"]);
    expect(result.authorDisplay).toBe("Machado");
    expect(result.primaryAuthorId).toBe("legacy");
  });
});
