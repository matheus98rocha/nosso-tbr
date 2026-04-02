import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { BookDomain } from "@/types/books.types";
import { useBookSearchRefinement } from "./useBookSearchRefinement";

function buildBook(overrides: Partial<BookDomain> & Pick<BookDomain, "id" | "title">): BookDomain {
  return {
    author: "",
    chosen_by: "",
    pages: 0,
    readerIds: [],
    readersDisplay: "",
    image_url: "",
    user_id: "",
    ...overrides,
  };
}

describe("useBookSearchRefinement", () => {
  it("preserves order when refinement is disabled", () => {
    const books = [
      buildBook({ id: "1", title: "Zeta" }),
      buildBook({ id: "2", title: "Alpha" }),
    ];

    const { result } = renderHook(() =>
      useBookSearchRefinement({
        books,
        searchTerm: "test",
        isEnabled: false,
      }),
    );

    expect(result.current.refinedBooks.map((b) => b.id)).toEqual(["1", "2"]);
  });

  it("preserves order when search normalizes to empty (only stop words)", () => {
    const books = [
      buildBook({ id: "1", title: "Zeta" }),
      buildBook({ id: "2", title: "Alpha" }),
    ];

    const { result } = renderHook(() =>
      useBookSearchRefinement({
        books,
        searchTerm: "o a de",
        isEnabled: true,
      }),
    );

    expect(result.current.refinedBooks.map((b) => b.id)).toEqual(["1", "2"]);
  });

  it("ranks closer title matches first for typos", () => {
    const books = [
      buildBook({ id: "1", title: "Outro Livro" }),
      buildBook({ id: "2", title: "Senhor dos Aneis" }),
      buildBook({ id: "3", title: "Completamente Diferente" }),
    ];

    const { result } = renderHook(() =>
      useBookSearchRefinement({
        books,
        searchTerm: "senhor dos aneis",
        isEnabled: true,
      }),
    );

    expect(result.current.refinedBooks[0].id).toBe("2");
  });

  it("treats titles with and without leading article as similarly close to query", () => {
    const books = [
      buildBook({ id: "1", title: "Outro" }),
      buildBook({ id: "2", title: "O Senhor dos Anéis" }),
    ];

    const { result } = renderHook(() =>
      useBookSearchRefinement({
        books,
        searchTerm: "Senhor dos Anéis",
        isEnabled: true,
      }),
    );

    expect(result.current.refinedBooks[0].id).toBe("2");
  });
});
