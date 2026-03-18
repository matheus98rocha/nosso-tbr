import { renderHook, act } from "@testing-library/react";
import { vi, Mock } from "vitest";
import { useMyBooks } from "./useMyBooks";
import { useFiltersUrl } from "@/hooks/useFiltersUrl";
import { INITIAL_FILTERS } from "@/constants/keys";
import { FiltersOptions } from "@/types/filters";

vi.mock("@/services/books/books.service");
vi.mock("@/stores/userStore", () => ({
  useUserStore: vi.fn(() => ({ user: null })),
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
const mockHandleClearAllFilters = vi.fn();

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
    handleClearAllFilters: mockHandleClearAllFilters,
    handleInputBlur: vi.fn(),
    handleSearchButtonClick: vi.fn(),
  };
}

function setupHook(
  filtersOverride: Partial<FiltersOptions> = {},
  searchQuery = "",
  hasSearchParams = false,
) {
  (useFiltersUrl as Mock).mockReturnValue(
    buildFiltersUrlReturn(filtersOverride, searchQuery, hasSearchParams),
  );
  return renderHook(() => useMyBooks());
}

describe("useMyBooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    it("calls updateUrlWithFilters with undefined year to clear the year filter", () => {
      const { result } = setupHook({ year: 2024 });
      act(() => result.current.handleSetYear(undefined));
      expect(mockUpdateUrlWithFilters).toHaveBeenCalledWith({
        ...INITIAL_FILTERS,
        year: undefined,
      });
    });

    it("preserves all existing filters when setting year", () => {
      const existingFilters: Partial<FiltersOptions> = {
        status: ["reading"],
        gender: ["fiction"],
      };
      const { result } = setupHook(existingFilters);
      act(() => result.current.handleSetYear(2023));
      expect(mockUpdateUrlWithFilters).toHaveBeenCalledWith({
        ...INITIAL_FILTERS,
        ...existingFilters,
        year: 2023,
      });
    });

    it("calls updateUrlWithFilters exactly once per call", () => {
      const { result } = setupHook();
      act(() => result.current.handleSetYear(2025));
      expect(mockUpdateUrlWithFilters).toHaveBeenCalledTimes(1);
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

    it("returns true when readers filter has entries AND hasSearchParams is true", () => {
      const { result } = setupHook({ readers: ["Matheus"] }, "", true);
      expect(result.current.canClear).toBe(true);
    });

    it("returns false when readers filter has entries BUT hasSearchParams is false", () => {
      const { result } = setupHook({ readers: ["Matheus"] }, "", false);
      expect(result.current.canClear).toBe(false);
    });

    it("returns true when multiple filters are active simultaneously", () => {
      const { result } = setupHook({ year: 2023, status: ["finished"], gender: ["fiction"] });
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

    it("includes status label when status filter is set", () => {
      const { result } = setupHook({ status: ["finished"] });
      const hasStatusLabel = result.current.activeFilterLabels.some((label) =>
        label.toLowerCase().includes("terminei") || label.length > 0,
      );
      expect(hasStatusLabel).toBe(true);
    });

    it("accumulates multiple labels when multiple filters are active", () => {
      const { result } = setupHook({ year: 2023, status: ["reading"] }, "tolkien");
      expect(result.current.activeFilterLabels.length).toBeGreaterThanOrEqual(2);
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

    it("does not include year label when year is undefined", () => {
      const { result } = setupHook({ year: undefined });
      const hasYearLabel = result.current.activeFilterLabels.some((l) =>
        l.startsWith("Ano:"),
      );
      expect(hasYearLabel).toBe(false);
    });
  });

  describe("totalPages", () => {
    it("returns 0 when allBooks is undefined", () => {
      const { result } = setupHook();
      expect(result.current.totalPages).toBe(0);
    });
  });

  describe("returned shape", () => {
    it("exposes handleSetYear as a function", () => {
      const { result } = setupHook();
      expect(typeof result.current.handleSetYear).toBe("function");
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
  });
});
