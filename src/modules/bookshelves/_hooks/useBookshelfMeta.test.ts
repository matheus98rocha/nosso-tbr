import { renderHook } from "@testing-library/react";
import { Mock, vi } from "vitest";
import { useBookshelfMeta } from "./useBookshelfMeta";
import { useQuery } from "@tanstack/react-query";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

describe("useBookshelfMeta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useQuery as Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });
  });

  it("disables the query when bookshelfId is undefined", () => {
    renderHook(() => useBookshelfMeta(undefined));
    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["bookshelf-meta", undefined],
        enabled: false,
      }),
    );
  });

  it("enables the query and sets queryKey when bookshelfId is defined", () => {
    renderHook(() => useBookshelfMeta("shelf-1"));
    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["bookshelf-meta", "shelf-1"],
        enabled: true,
        staleTime: 1000 * 60 * 5,
      }),
    );
  });

  it("exposes data from useQuery", () => {
    (useQuery as Mock).mockReturnValue({
      data: { id: "shelf-1", name: "Favoritos" },
      isLoading: false,
      isError: false,
    });
    const { result } = renderHook(() => useBookshelfMeta("shelf-1"));
    expect(result.current.data).toEqual({
      id: "shelf-1",
      name: "Favoritos",
    });
  });
});
