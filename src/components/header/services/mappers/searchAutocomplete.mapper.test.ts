import { describe, expect, it } from "vitest";
import { SearchAutocompleteMapper } from "./searchAutocomplete.mapper";

describe("SearchAutocompleteMapper", () => {
  it("prioriza match por prefixo", () => {
    const result = SearchAutocompleteMapper.toDomain(
      {
        id: "1",
        label: "Dom Casmurro",
        type: "book",
      },
      "dom",
    );

    expect(result.score).toBe(2);
  });

  it("aplica score de contains quando não há prefixo", () => {
    const result = SearchAutocompleteMapper.toDomain(
      {
        id: "2",
        label: "Machado de Assis",
        type: "author",
      },
      "assis",
    );

    expect(result.score).toBe(1);
  });

  it("retorna score zero para termos sem match", () => {
    const result = SearchAutocompleteMapper.toDomain(
      {
        id: "3",
        label: "Memórias Póstumas",
        type: "book",
      },
      "clarice",
    );

    expect(result.score).toBe(0);
  });

  it("trata termo sem acento como match com rótulo acentuado", () => {
    const result = SearchAutocompleteMapper.toDomain(
      {
        id: "4",
        label: "O Senhor dos Anéis",
        type: "book",
      },
      "aneis",
    );

    expect(result.score).toBeGreaterThan(0);
  });
});
