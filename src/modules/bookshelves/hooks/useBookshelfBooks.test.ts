import { renderHook } from "@testing-library/react";
import { Mock, vi } from "vitest";
import { useBookshelfBooks } from "./useBookshelfBooks";
import { useQuery } from "@tanstack/react-query";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

vi.mock("@/stores/hooks/useAuth", () => ({
  useIsLoggedIn: vi.fn(),
}));

describe("useBookshelfBooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useIsLoggedIn as Mock).mockReturnValue(true);
    (useQuery as Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
  });

  it("disables the query when bookshelfId is undefined", () => {
    renderHook(() => useBookshelfBooks(undefined));
    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["bookshelf-books", undefined],
        enabled: false,
      }),
    );
  });

  it("disables the query when user is not logged in", () => {
    (useIsLoggedIn as Mock).mockReturnValue(false);
    renderHook(() => useBookshelfBooks("shelf-1"));
    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    );
  });

  it("enables the query when bookshelfId is defined and user is logged in", () => {
    renderHook(() => useBookshelfBooks("shelf-1"));
    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["bookshelf-books", "shelf-1"],
        enabled: true,
        staleTime: 1000 * 60 * 5,
      }),
    );
  });
});
