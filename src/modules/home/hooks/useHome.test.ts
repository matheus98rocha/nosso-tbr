import { renderHook, act } from "@testing-library/react";
import { vi, Mock } from "vitest";
import { useHome } from "./useHome";
import { useFiltersUrl } from "@/hooks/useFiltersUrl";
import { useQuery } from "@tanstack/react-query";
import { INITIAL_FILTERS } from "@/constants/keys";
import { FiltersOptions } from "@/types/filters";

vi.mock("@/services/books/books.service");
vi.mock("@/services/users/hooks/useUsers", () => ({
  useUser: vi.fn(() => ({ users: [], isLoadingUsers: false })),
}));
vi.mock("@/stores/userStore", () => ({
  useUserStore: vi.fn(() => null),
}));
vi.mock("@/stores/hooks/useAuth", () => ({
  useIsLoggedIn: vi.fn(() => false),
}));
vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(() => ({
    data: undefined,
    isFetching: false,
    isFetched: true,
    isError: false,
  })),
}));
vi.mock("@/hooks/useStatusFilters", () => ({
  useStatusFilters: vi.fn(() => ({
    activeStatuses: [],
    handleToggleStatus: vi.fn(),
  })),
}));
vi.mock("@/hooks/useFiltersUrl");

const mockUpdateUrlWithFilters = vi.fn();

function buildFiltersUrlReturn(
  filtersOverride: Partial<FiltersOptions> = {},
  searchQuery = "",
  hasSearchParams = false,
) {
  return {
    filters: { ...INITIAL_FILTERS, ...filtersOverride },
    searchQuery,
    hasSearchParams,
    inputRef: { current: null } as React.RefObject<HTMLInputElement | null>,
    updateUrlWithFilters: mockUpdateUrlWithFilters,
    handleOnPressEnter: vi.fn(),
    handleClearAllFilters: vi.fn(),
    handleInputBlur: vi.fn(),
    handleSearchButtonClick: vi.fn(),
  };
}

function mockQueryData(total: number) {
  (useQuery as Mock).mockReturnValue({
    data: { data: [], total },
    isFetching: false,
    isFetched: true,
    isError: false,
  });
}

function setupHook(
  filtersOverride: Partial<FiltersOptions> = {},
  searchQuery = "",
  hasSearchParams = false,
) {
  (useFiltersUrl as Mock).mockReturnValue(
    buildFiltersUrlReturn(filtersOverride, searchQuery, hasSearchParams),
  );
  return renderHook(() => useHome());
}

describe("useHome", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("totalPages — PAGE_SIZE = 8", () => {
    it("returns 0 when allBooks is undefined", () => {
      const { result } = setupHook();
      expect(result.current.totalPages).toBe(0);
    });

    it("returns 0 when total is 0", () => {
      mockQueryData(0);
      const { result } = setupHook();
      expect(result.current.totalPages).toBe(0);
    });

    it("returns 1 page for exactly 8 books (full first page)", () => {
      mockQueryData(8);
      const { result } = setupHook();
      expect(result.current.totalPages).toBe(1);
    });

    it("returns 2 pages for 9 books — reproduces the pagination bug", () => {
      mockQueryData(9);
      const { result } = setupHook();
      expect(result.current.totalPages).toBe(2);
    });

    it("returns 2 pages for 16 books (two full pages)", () => {
      mockQueryData(16);
      const { result } = setupHook();
      expect(result.current.totalPages).toBe(2);
    });

    it("returns 3 pages for 17 books", () => {
      mockQueryData(17);
      const { result } = setupHook();
      expect(result.current.totalPages).toBe(3);
    });

    it("returns 3 pages for 24 books (three full pages)", () => {
      mockQueryData(24);
      const { result } = setupHook();
      expect(result.current.totalPages).toBe(3);
    });

    it("returns 4 pages for 25 books", () => {
      mockQueryData(25);
      const { result } = setupHook();
      expect(result.current.totalPages).toBe(4);
    });

    it("never uses a PAGE_SIZE of 10 — 9 books must not return 1 page", () => {
      mockQueryData(9);
      const { result } = setupHook();
      expect(result.current.totalPages).not.toBe(1);
    });
  });

  describe("currentPage", () => {
    it("starts at page 0", () => {
      const { result } = setupHook();
      expect(result.current.currentPage).toBe(0);
    });

    it("advances to the next page when setCurrentPage is called", () => {
      const { result } = setupHook();
      act(() => result.current.setCurrentPage(1));
      expect(result.current.currentPage).toBe(1);
    });

    it("resets to page 0 when filters change", () => {
      (useFiltersUrl as Mock).mockReturnValue(
        buildFiltersUrlReturn({ status: [] }),
      );
      const { result, rerender } = renderHook(() => useHome());

      act(() => result.current.setCurrentPage(2));
      expect(result.current.currentPage).toBe(2);

      (useFiltersUrl as Mock).mockReturnValue(
        buildFiltersUrlReturn({ status: ["reading"] }),
      );
      rerender();

      expect(result.current.currentPage).toBe(0);
    });

    it("resets to page 0 when searchQuery changes", () => {
      (useFiltersUrl as Mock).mockReturnValue(
        buildFiltersUrlReturn({}, ""),
      );
      const { result, rerender } = renderHook(() => useHome());

      act(() => result.current.setCurrentPage(3));
      expect(result.current.currentPage).toBe(3);

      (useFiltersUrl as Mock).mockReturnValue(
        buildFiltersUrlReturn({}, "tolkien"),
      );
      rerender();

      expect(result.current.currentPage).toBe(0);
    });
  });

  describe("handleSetYear", () => {
    it("calls updateUrlWithFilters with the selected year merged into current filters", () => {
      const { result } = setupHook();
      act(() => result.current.handleSetYear(2024));
      expect(mockUpdateUrlWithFilters).toHaveBeenCalledWith({
        ...INITIAL_FILTERS,
        year: 2024,
      });
    });

    it("calls updateUrlWithFilters with undefined to clear the year filter", () => {
      const { result } = setupHook({ year: 2024 });
      act(() => result.current.handleSetYear(undefined));
      expect(mockUpdateUrlWithFilters).toHaveBeenCalledWith({
        ...INITIAL_FILTERS,
        year: undefined,
      });
    });

    it("preserves all existing filters when setting year", () => {
      const existing: Partial<FiltersOptions> = {
        status: ["reading"],
        gender: ["fiction"],
      };
      const { result } = setupHook(existing);
      act(() => result.current.handleSetYear(2023));
      expect(mockUpdateUrlWithFilters).toHaveBeenCalledWith({
        ...INITIAL_FILTERS,
        ...existing,
        year: 2023,
      });
    });
  });
});
