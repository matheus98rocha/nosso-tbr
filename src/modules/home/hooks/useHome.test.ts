import { renderHook, act } from "@testing-library/react";
import { vi, Mock } from "vitest";
import { useHome } from "./useHome";
import { useFiltersUrl } from "@/hooks/useFiltersUrl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { INITIAL_FILTERS } from "@/constants/keys";
import { FiltersOptions } from "@/types/filters";
import { useUser } from "@/services/users/hooks/useUsers";

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
  useQueryClient: vi.fn(() => ({
    prefetchQuery: vi.fn(),
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
const mockUsers = [
  { id: "1", display_name: "Matheus" },
  { id: "2", display_name: "Barbara" },
];

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
    data: {
      data: Array.from({ length: total }, (_, index) => ({
        id: String(index + 1),
        readers: ["Matheus", "Barbara"],
      })),
      total,
    },
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
    (useUser as Mock).mockReturnValue({
      users: [],
      isLoadingUsers: false,
    });
    (useQueryClient as Mock).mockReturnValue({
      prefetchQuery: vi.fn(),
    });
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
      (useFiltersUrl as Mock).mockReturnValue(buildFiltersUrlReturn({}, ""));
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

  describe("handleToggleMyBooks", () => {
    it("calls updateUrlWithFilters toggling myBooks to true", () => {
      const { result } = setupHook({ myBooks: false });
      act(() => result.current.handleToggleMyBooks());
      expect(mockUpdateUrlWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({ myBooks: true }),
      );
    });

    it("calls updateUrlWithFilters toggling myBooks to false", () => {
      const { result } = setupHook({ myBooks: true });
      act(() => result.current.handleToggleMyBooks());
      expect(mockUpdateUrlWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({ myBooks: false }),
      );
    });

    it("preserves existing filters when toggling myBooks", () => {
      const existing: Partial<FiltersOptions> = {
        status: ["reading"],
        year: 2024,
      };
      const { result } = setupHook({ ...existing, myBooks: false });
      act(() => result.current.handleToggleMyBooks());
      expect(mockUpdateUrlWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({ ...existing, myBooks: true }),
      );
    });
  });

  describe("canClear", () => {
    it("returns false when all filters are empty and no search", () => {
      const { result } = setupHook();
      expect(result.current.canClear).toBe(false);
    });

    it("returns true when year filter is set", () => {
      const { result } = setupHook({ year: 2024 });
      expect(result.current.canClear).toBe(true);
    });

    it("returns true when status filter has entries", () => {
      const { result } = setupHook({ status: ["reading"] });
      expect(result.current.canClear).toBe(true);
    });

    it("returns true when gender filter has entries", () => {
      const { result } = setupHook({ gender: ["fiction"] });
      expect(result.current.canClear).toBe(true);
    });

    it("returns true when searchQuery is set AND hasSearchParams is true", () => {
      const { result } = setupHook({}, "senhor dos aneis", true);
      expect(result.current.canClear).toBe(true);
    });

    it("returns false when searchQuery is set BUT hasSearchParams is false", () => {
      const { result } = setupHook({}, "senhor dos aneis", false);
      expect(result.current.canClear).toBe(false);
    });

    it("returns true when myBooks is active", () => {
      const { result } = setupHook({ myBooks: true });
      expect(result.current.canClear).toBe(true);
    });

    it("returns true when multiple filters are active simultaneously", () => {
      const { result } = setupHook({
        year: 2023,
        status: ["finished"],
        gender: ["fiction"],
      });
      expect(result.current.canClear).toBe(true);
    });
  });

  describe("activeFilterLabels", () => {
    it("returns empty array when no filters are active", () => {
      const { result } = setupHook();
      expect(result.current.activeFilterLabels).toEqual([]);
    });

    it("includes quoted searchQuery when searchQuery is set", () => {
      const { result } = setupHook({}, "tolkien");
      expect(result.current.activeFilterLabels).toContain('"tolkien"');
    });

    it("includes year label when year filter is set", () => {
      const { result } = setupHook({ year: 2024 });
      expect(result.current.activeFilterLabels).toContain("Ano: 2024");
    });

    it('includes "Meus Livros" when myBooks is active', () => {
      const { result } = setupHook({ myBooks: true });
      expect(result.current.activeFilterLabels).toContain("Meus Livros");
    });

    it("accumulates multiple labels when multiple filters are active", () => {
      const { result } = setupHook(
        { year: 2023, status: ["reading"] },
        "tolkien",
      );
      expect(result.current.activeFilterLabels.length).toBeGreaterThanOrEqual(
        2,
      );
      expect(result.current.activeFilterLabels).toContain('"tolkien"');
      expect(result.current.activeFilterLabels).toContain("Ano: 2023");
    });

    it("returns array (not string) so the component can join with separator", () => {
      const { result } = setupHook({ year: 2024 }, "search");
      expect(Array.isArray(result.current.activeFilterLabels)).toBe(true);
    });

    it("returns empty array after filters are cleared", () => {
      const { result: resultWithFilter } = setupHook({ year: 2024 });
      expect(resultWithFilter.current.activeFilterLabels).not.toHaveLength(0);

      const { result: resultClear } = setupHook();
      expect(resultClear.current.activeFilterLabels).toHaveLength(0);
    });
  });

  describe("returned shape", () => {
    it("exposes handleSetYear as a function", () => {
      const { result } = setupHook();
      expect(typeof result.current.handleSetYear).toBe("function");
    });

    it("exposes handleToggleMyBooks as a function", () => {
      const { result } = setupHook();
      expect(typeof result.current.handleToggleMyBooks).toBe("function");
    });

    it("exposes canClear as a boolean", () => {
      const { result } = setupHook();
      expect(typeof result.current.canClear).toBe("boolean");
    });

    it("exposes activeFilterLabels as an array", () => {
      const { result } = setupHook();
      expect(Array.isArray(result.current.activeFilterLabels)).toBe(true);
    });

    it("exposes activeStatuses from useStatusFilters", () => {
      const { result } = setupHook();
      expect(Array.isArray(result.current.activeStatuses)).toBe(true);
    });

    it("exposes isMyBooksActive as a boolean", () => {
      const { result } = setupHook();
      expect(typeof result.current.isMyBooksActive).toBe("boolean");
    });

    it("exposes isLoggedIn as a boolean", () => {
      const { result } = setupHook();
      expect(typeof result.current.isLoggedIn).toBe("boolean");
    });

    it("exposes handleToggleReader as a function", () => {
      const { result } = setupHook();
      expect(typeof result.current.handleToggleReader).toBe("function");
    });

    it("exposes checkIsUserActive as a function", () => {
      const { result } = setupHook();
      expect(typeof result.current.checkIsUserActive).toBe("function");
    });
  });

  describe("joint reading readers filters", () => {
    it("keeps readers filter empty when all readers are selected by default", () => {
      (useUser as Mock).mockReturnValue({
        users: mockUsers,
        isLoadingUsers: false,
      });

      const { result } = setupHook({ readers: [] });
      expect(result.current.readersObj.readers).toEqual([]);
    });

    it("marks all readers as active when filters.readers is empty", () => {
      (useUser as Mock).mockReturnValue({
        users: mockUsers,
        isLoadingUsers: false,
      });

      const { result } = setupHook({ readers: [] });
      expect(result.current.checkIsUserActive("Matheus")).toBe(true);
      expect(result.current.checkIsUserActive("Barbara")).toBe(true);
    });

    it("toggles reader selection from default-all state", () => {
      (useUser as Mock).mockReturnValue({
        users: mockUsers,
        isLoadingUsers: false,
      });

      const { result } = setupHook({ readers: [] });

      act(() => result.current.handleToggleReader("Matheus"));

      expect(mockUpdateUrlWithFilters).toHaveBeenCalledWith({
        ...INITIAL_FILTERS,
        readers: ["Barbara"],
      });
    });

    it("adds a reader back when it is currently not selected", () => {
      (useUser as Mock).mockReturnValue({
        users: mockUsers,
        isLoadingUsers: false,
      });

      const { result } = setupHook({ readers: ["Barbara"] });

      act(() => result.current.handleToggleReader("Matheus"));

      expect(mockUpdateUrlWithFilters).toHaveBeenCalledWith({
        ...INITIAL_FILTERS,
        readers: ["Barbara", "Matheus"],
      });
    });

    it("does not treat stale reader list with same length as 'all selected'", () => {
      (useUser as Mock).mockReturnValue({
        users: mockUsers,
        isLoadingUsers: false,
      });

      const { result } = setupHook({ readers: ["Matheus", "Leitor Removido"] });

      expect(result.current.readersObj.readers).toEqual([
        "Matheus",
        "Leitor Removido",
      ]);
    });

    it("in joint-reading mode only keeps books with more than one reader", () => {
      (useUser as Mock).mockReturnValue({
        users: mockUsers,
        isLoadingUsers: false,
      });

      (useQuery as Mock).mockReturnValue({
        data: {
          data: [
            { id: "1", readers: ["Matheus", "Barbara"] },
            { id: "2", readers: ["Matheus"] },
            { id: "3", readers: ["Barbara", "Carol"] },
          ],
          total: 3,
        },
        isFetching: false,
        isFetched: true,
        isError: false,
      });

      const { result } = setupHook({ readers: [] });

      expect(result.current.allBooks?.total).toBe(2);
      expect(result.current.allBooks?.data.map((book) => book.id)).toEqual([
        "1",
        "3",
      ]);
    });
  });
});
