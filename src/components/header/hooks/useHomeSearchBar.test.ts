import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useHomeSearchBar } from "./useHomeSearchBar";

const replaceMock = vi.fn();
const useSearchParamsMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => useSearchParamsMock(),
}));

vi.mock("./useSearchAutocomplete", () => ({
  useSearchAutocomplete: () => ({
    groupedResults: { books: [], authors: [] },
    isLoading: false,
    shouldSearch: false,
  }),
}));

describe("useHomeSearchBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("preserva myBooks=true ao buscar manualmente", () => {
    const params = new URLSearchParams("myBooks=true&status=reading");
    useSearchParamsMock.mockReturnValue(params);

    const { result } = renderHook(() => useHomeSearchBar());

    act(() => {
      result.current.handleSearchButtonClick("hobbit");
    });

    expect(replaceMock).toHaveBeenCalledWith("?search=hobbit&status=reading&myBooks=true");
  });

  it("preserva myBooks=true ao selecionar sugestão de livro", () => {
    const params = new URLSearchParams("myBooks=true");
    useSearchParamsMock.mockReturnValue(params);

    const { result } = renderHook(() => useHomeSearchBar());

    act(() => {
      result.current.handleSelectSuggestion({
        id: "book-1",
        label: "O Hobbit",
        type: "book",
        score: 2,
      });
    });

    expect(replaceMock).toHaveBeenCalledWith(
      "?search=O+Hobbit&bookId=book-1&myBooks=true",
    );
  });
});
