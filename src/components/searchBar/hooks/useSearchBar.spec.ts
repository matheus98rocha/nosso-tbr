import { act, renderHook } from "@testing-library/react";
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

  it("shows autocomplete when shouldSearch becomes true without refocusing after it was false", () => {
    const { result, rerender } = renderHook(
      ({ shouldSearch }: { shouldSearch: boolean }) =>
        useSearchBar({
          groupedResults: {
            books: [{ id: "1", label: "Ab", type: "book", score: 1 }],
            authors: [],
          },
          shouldSearch,
        }),
      { initialProps: { shouldSearch: false } },
    );

    act(() => {
      result.current.handleFocusInput();
    });

    expect(result.current.showAutocomplete).toBe(false);

    rerender({ shouldSearch: true });

    expect(result.current.showAutocomplete).toBe(true);
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
