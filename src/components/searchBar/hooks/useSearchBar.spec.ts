import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useSearchBar } from "./useSearchBar";

describe("useSearchBar", () => {
  it("does not show autocomplete when shouldSearch is false", () => {
    const { result } = renderHook(() =>
      useSearchBar({
        groupedResults: { books: [], authors: [] },
        shouldSearch: false,
      }),
    );

    expect(result.current.showAutocomplete).toBe(false);
  });

  it("computes hasResults when grouped results are non-empty", () => {
    const { result } = renderHook(() =>
      useSearchBar({
        groupedResults: {
          books: [{ id: "1", label: "X", type: "book", score: 1 }],
          authors: [],
        },
      }),
    );

    expect(result.current.hasResults).toBe(true);
  });
});
