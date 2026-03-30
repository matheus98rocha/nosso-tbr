import { renderHook, act } from "@testing-library/react";
import { vi, Mock } from "vitest";
import { useHome } from "./useHome";
import { useFiltersUrl } from "@/hooks/useFiltersUrl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { INITIAL_FILTERS, QUERY_KEYS } from "@/constants/keys";
import { FiltersOptions } from "@/types/filters";
import { useUser } from "@/services/users/hooks/useUsers";
import { useUserStore } from "@/stores/userStore";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { BookService } from "@/services/books/books.service";
import { UserSocialService } from "@/services/userSocial/userSocial.service";

const { mockPrefetchQuery } = vi.hoisted(() => ({
  mockPrefetchQuery: vi.fn(),
}));

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
  useQuery: vi.fn((params: { queryKey?: unknown[] }) => {
    if (Array.isArray(params?.queryKey) && params.queryKey[0] === "userSocial") {
      return { data: [], isLoading: false, isFetching: false, isFetched: true, isError: false };
    }

    return {
      data: undefined,
      isFetching: false,
      isFetched: true,
      isError: false,
    };
  }),
  useQueryClient: vi.fn(() => ({
    prefetchQuery: mockPrefetchQuery,
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

function mockQueryData(total: number, followingIds: string[] = []) {
  (useQuery as Mock)
    .mockReturnValueOnce({
      data: followingIds,
      isLoading: false,
      isFetching: false,
      isFetched: true,
      isError: false,
    })
    .mockReturnValueOnce({
      data: {
        data: Array.from({ length: total }, (_, index) => ({
          id: String(index + 1),
          readerIds: ["1", "2"],
          readersDisplay: "Matheus e Barbara",
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
    mockPrefetchQuery.mockClear();
    (useIsLoggedIn as unknown as Mock).mockReturnValue(false);
    (useUserStore as unknown as Mock).mockImplementation((selector) =>
      selector({ user: null }),
    );
    (useUser as Mock).mockReturnValue({
      users: [],
      isLoadingUsers: false,
    });
    (useQuery as Mock).mockImplementation((params: { queryKey?: unknown[] }) => {
      if (Array.isArray(params?.queryKey) && params.queryKey[0] === "userSocial") {
        return { data: [], isLoading: false, isFetching: false, isFetched: true, isError: false };
      }
      return { data: undefined, isFetching: false, isFetched: true, isError: false };
    });
    (useQueryClient as Mock).mockReturnValue({
      prefetchQuery: mockPrefetchQuery,
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

  describe('"Todos" default behavior and query keys', () => {
    it('defaults to "Todos" on initial load', () => {
      const { result } = setupHook();

      expect(result.current.filters.view).toBe("todos");
      expect(result.current.isAllBooksActive).toBe(true);
    });

    it("uses a deterministic query key for the Todos view", () => {
      (useUser as Mock).mockReturnValue({ users: mockUsers, isLoadingUsers: false });

      setupHook({ view: "todos" });

      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: [
            ...QUERY_KEYS.books.list(
              { ...INITIAL_FILTERS, view: "todos", readers: [] },
              "",
              0,
              undefined,
            ),
            "relationship",
            "none",
          ],
        }),
      );
    });

    it("usa relacionamento baseado em usuário atual + seguidos na query key", () => {
      (useIsLoggedIn as unknown as Mock).mockReturnValue(true);
      (useUserStore as unknown as Mock).mockReturnValue({ id: "1", display_name: "Matheus" });
      (useUser as Mock).mockReturnValue({ users: mockUsers, isLoadingUsers: false });
      mockQueryData(0, ["2"]);

      setupHook({ view: "todos" });

      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: expect.arrayContaining(["relationship", "1|2"]),
        }),
      );
    });

    it("when logged in with no follows, relationship key is only the current user (empty feed from scoped query)", () => {
      (useIsLoggedIn as unknown as Mock).mockReturnValue(true);
      (useUserStore as unknown as Mock).mockReturnValue({ id: "1", display_name: "Matheus" });
      (useUser as Mock).mockReturnValue({ users: mockUsers, isLoadingUsers: false });
      mockQueryData(0, []);

      setupHook({ view: "todos" });

      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: expect.arrayContaining(["relationship", "1"]),
        }),
      );
    });

    it("reacts to filter changes by updating the selected view", () => {
      const { result } = setupHook({ view: "todos" });

      act(() => result.current.handleSetJointReading());

      expect(mockUpdateUrlWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({ view: "joint", myBooks: false }),
      );
    });
  });

  describe('"Todos" reader selection behavior', () => {
    it("marks current user and followed users as active by default in Todos", () => {
      (useIsLoggedIn as unknown as Mock).mockReturnValue(true);
      (useUserStore as unknown as Mock).mockReturnValue({ id: "1", display_name: "Matheus" });
      (useUser as Mock).mockReturnValue({ users: mockUsers, isLoadingUsers: false });

      mockQueryData(0, ["2"]);
      const { result } = setupHook({ view: "todos", readers: [] });

      expect(result.current.checkIsUserActive("1")).toBe(true);
      expect(result.current.checkIsUserActive("2")).toBe(true);
    });

    it("adds additional readers in Todos when user toggles chips", () => {
      (useIsLoggedIn as unknown as Mock).mockReturnValue(true);
      (useUserStore as unknown as Mock).mockReturnValue({ id: "1", display_name: "Matheus" });
      (useUser as Mock).mockReturnValue({ users: mockUsers, isLoadingUsers: false });

      const { result } = setupHook({ view: "todos", readers: ["1"] });

      act(() => result.current.handleToggleReader("2"));

      expect(mockUpdateUrlWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({ readers: ["1", "2"] }),
      );
    });

    it("limita leitores visíveis na visão Todos para usuário atual e seguidos", () => {
      (useIsLoggedIn as unknown as Mock).mockReturnValue(true);
      (useUserStore as unknown as Mock).mockReturnValue({ id: "1", display_name: "Matheus" });
      (useUser as Mock).mockReturnValue({
        users: [
          ...mockUsers,
          { id: "3", display_name: "Nao Seguido" },
        ],
        isLoadingUsers: false,
      });
      mockQueryData(0, ["2"]);

      const { result } = setupHook({ view: "todos", readers: [] });

      expect(result.current.readers.map((r) => r.id)).toEqual(["1", "2"]);
    });

    it("changes query key when Todos readers selection changes", () => {
      (useIsLoggedIn as unknown as Mock).mockReturnValue(true);
      (useUserStore as unknown as Mock).mockReturnValue({ id: "1", display_name: "Matheus" });
      (useUser as Mock).mockReturnValue({ users: mockUsers, isLoadingUsers: false });
      (useQuery as Mock).mockImplementation((params: { queryKey?: unknown[] }) => {
        if (Array.isArray(params?.queryKey) && params.queryKey[0] === "userSocial") {
          return { data: ["2"], isLoading: false, isFetching: false, isFetched: true, isError: false };
        }
        return { data: undefined, isFetching: false, isFetched: true, isError: false };
      });

      (useFiltersUrl as Mock).mockReturnValue(
        buildFiltersUrlReturn({ view: "todos", readers: ["1"] }),
      );
      const { rerender } = renderHook(() => useHome());

      const firstCall = (useQuery as Mock).mock.calls.at(-1)?.[0]?.queryKey;

      (useFiltersUrl as Mock).mockReturnValue(
        buildFiltersUrlReturn({ view: "todos", readers: ["2"] }),
      );
      rerender();

      const secondCall = (useQuery as Mock).mock.calls.at(-1)?.[0]?.queryKey;

      expect(JSON.stringify(firstCall)).not.toBe(JSON.stringify(secondCall));
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

    it("restores the previous non-myBooks view when disabling myBooks", () => {
      const { result } = setupHook({ myBooks: true, view: "todos" });

      act(() => result.current.handleToggleMyBooks());

      expect(mockUpdateUrlWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({ myBooks: false, view: "todos" }),
      );
    });
  });



  describe("handleSetAllBooks", () => {
    it("resets view to todos, disables myBooks and clears readers", () => {
      const { result } = setupHook({
        view: "joint",
        myBooks: true,
        readers: ["1", "2"],
      });

      act(() => result.current.handleSetAllBooks());

      expect(mockUpdateUrlWithFilters).toHaveBeenCalledWith({
        ...INITIAL_FILTERS,
        view: "todos",
        myBooks: false,
        readers: [],
      });
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

      const { result } = setupHook({ readers: [], view: "joint" });
      expect(result.current.readersObj.readers).toEqual([]);
    });

    it("marks all readers as active when filters.readers is empty", () => {
      (useUser as Mock).mockReturnValue({
        users: mockUsers,
        isLoadingUsers: false,
      });

      const { result } = setupHook({ readers: [], view: "joint" });
      expect(result.current.checkIsUserActive("1")).toBe(true);
      expect(result.current.checkIsUserActive("2")).toBe(true);
    });

    it("toggles reader selection from default-all state", () => {
      (useUser as Mock).mockReturnValue({
        users: mockUsers,
        isLoadingUsers: false,
      });

      const { result } = setupHook({ readers: [], view: "joint" });

      act(() => result.current.handleToggleReader("1"));

      expect(mockUpdateUrlWithFilters).toHaveBeenCalledWith({
        ...INITIAL_FILTERS,
        view: "joint",
        readers: ["2"],
      });
    });

    it("adds a reader back when it is currently not selected", () => {
      (useUser as Mock).mockReturnValue({
        users: mockUsers,
        isLoadingUsers: false,
      });

      const { result } = setupHook({ readers: ["2"], view: "joint" });

      act(() => result.current.handleToggleReader("1"));

      expect(mockUpdateUrlWithFilters).toHaveBeenCalledWith({
        ...INITIAL_FILTERS,
        view: "joint",
        readers: ["2", "1"],
      });
    });

    it("does not treat stale reader list with same length as 'all selected'", () => {
      (useUser as Mock).mockReturnValue({
        users: mockUsers,
        isLoadingUsers: false,
      });

      const { result } = setupHook({ readers: ["1", "stale-unknown"], view: "joint" });

      expect(result.current.readersObj.readers).toEqual([
        "1",
        "stale-unknown",
      ]);
    });



    it("checkIsUserActive returns false when reader is not selected in joint mode", () => {
      (useUser as Mock).mockReturnValue({
        users: mockUsers,
        isLoadingUsers: false,
      });

      const { result } = setupHook({ readers: ["1"], view: "joint" });

      expect(result.current.checkIsUserActive("2")).toBe(false);
    });

    it("in joint-reading mode only keeps books with more than one reader", () => {
      (useUser as Mock).mockReturnValue({
        users: mockUsers,
        isLoadingUsers: false,
      });

      (useQuery as Mock).mockReturnValue({
        data: {
          data: [
            { id: "1", readerIds: ["1", "2"], readersDisplay: "Matheus e Barbara" },
            { id: "2", readerIds: ["1"], readersDisplay: "Matheus" },
            { id: "3", readerIds: ["2", "9"], readersDisplay: "Barbara e Carol" },
          ],
          total: 3,
        },
        isFetching: false,
        isFetched: true,
        isError: false,
      });

      const { result } = setupHook({ readers: [], view: "joint" });

      expect(result.current.allBooks?.total).toBe(2);
      expect(result.current.allBooks?.data.map((book) => book.id)).toEqual([
        "1",
        "3",
      ]);
    });

    it("keeps joint books when no readers are available (selectedReadersSet empty)", () => {
      (useUser as Mock).mockReturnValue({
        users: [],
        isLoadingUsers: false,
      });

      (useQuery as Mock).mockReturnValue({
        data: {
          data: [{ id: "1", readerIds: ["10", "11"], readersDisplay: "A e B" }],
          total: 1,
        },
        isFetching: false,
        isFetched: true,
        isError: false,
      });

      const { result } = setupHook({ readers: [], view: "joint" });

      expect(result.current.allBooks?.total).toBe(1);
      expect(result.current.allBooks?.data.map((book) => book.id)).toEqual(["1"]);
    });
  });

  describe("books list empty state (showEmptyReadingSuggestions vs isBooksListAwaitingData)", () => {
    function mockFollowingThenBooks(overrides: {
      followingIds?: string[];
      total?: number;
      isFetching?: boolean;
      isFetched?: boolean;
      isError?: boolean;
    }) {
      const {
        followingIds = [],
        total = 0,
        isFetching = false,
        isFetched = true,
        isError = false,
      } = overrides;
      (useQuery as Mock)
        .mockReturnValueOnce({
          data: followingIds,
          isLoading: false,
          isFetching: false,
          isFetched: true,
          isError: false,
        })
        .mockReturnValueOnce({
          data: {
            data: [],
            total,
          },
          isFetching,
          isFetched,
          isError,
        });
    }

    it("shows empty reading suggestions when the books query finished with zero books", () => {
      mockFollowingThenBooks({ total: 0, isFetching: false });
      const { result } = setupHook();

      expect(result.current.isBooksListAwaitingData).toBe(false);
      expect(result.current.showEmptyReadingSuggestions).toBe(true);
    });

    it("does not show empty suggestions while the books query is fetching", () => {
      mockFollowingThenBooks({ total: 0, isFetching: true, isFetched: false });
      const { result } = setupHook();

      expect(result.current.isBooksListAwaitingData).toBe(true);
      expect(result.current.showEmptyReadingSuggestions).toBe(false);
    });

    it("does not show empty suggestions while waiting for users when no reader filter is selected", () => {
      (useUser as Mock).mockReturnValue({
        users: [],
        isLoadingUsers: true,
      });
      mockFollowingThenBooks({ total: 0 });
      const { result } = setupHook();

      expect(result.current.shouldWaitForUsers).toBe(true);
      expect(result.current.isBooksListAwaitingData).toBe(true);
      expect(result.current.showEmptyReadingSuggestions).toBe(false);
    });

    it("allows empty suggestions when users are still loading but My Books is active (query not gated on users)", () => {
      (useIsLoggedIn as unknown as Mock).mockReturnValue(true);
      (useUserStore as unknown as Mock).mockReturnValue({
        id: "1",
        display_name: "Matheus",
      });
      (useUser as Mock).mockReturnValue({
        users: mockUsers,
        isLoadingUsers: true,
      });
      mockFollowingThenBooks({ total: 0 });

      const { result } = setupHook({ myBooks: true });

      expect(result.current.shouldWaitForUsers).toBe(false);
      expect(result.current.isBooksListAwaitingData).toBe(false);
      expect(result.current.showEmptyReadingSuggestions).toBe(true);
      expect(result.current.isLoadingAllBooks).toBe(true);
    });

    it("does not show empty suggestions when the books query errored", () => {
      mockFollowingThenBooks({ total: 0, isError: true, isFetched: true });
      const { result } = setupHook();

      expect(result.current.showEmptyReadingSuggestions).toBe(false);
    });
  });

  describe("books query configuration", () => {
    it("builds default filters factory with view todos and empty arrays", () => {
      (useFiltersUrl as Mock).mockImplementation((factory) => {
        const defaults = factory();
        expect(defaults).toEqual({
          readers: [],
          status: [],
          gender: [],
          view: "todos",
          userId: "",
          bookId: "",
          authorId: "",
          year: undefined,
          myBooks: false,
        });
        return buildFiltersUrlReturn();
      });

      setupHook();
    });

    it("calls user social queryFn to load following ids", async () => {
      (useIsLoggedIn as unknown as Mock).mockReturnValue(true);
      (useUserStore as unknown as Mock).mockImplementation((selector) =>
        selector({ user: { id: "1", display_name: "Matheus" } }),
      );
      vi.spyOn(UserSocialService.prototype, "getFollowingIds").mockResolvedValueOnce(["2"]);

      setupHook();

      const socialCall = (useQuery as Mock).mock.calls.find(
        ([cfg]) => Array.isArray(cfg?.queryKey) && cfg.queryKey[0] === "userSocial",
      )?.[0];

      await expect(socialCall.queryFn()).resolves.toEqual(["2"]);
    });

    it("retries syncing specific book for logged-in users up to 2 attempts", () => {
      (useIsLoggedIn as unknown as Mock).mockReturnValue(true);
      (useUserStore as unknown as Mock).mockImplementation((selector) =>
        selector({ user: { id: "1", display_name: "Matheus" } }),
      );
      setupHook({ bookId: "b-1", myBooks: true });

      const booksCall = (useQuery as Mock).mock.calls.find(
        ([cfg]) => Array.isArray(cfg?.queryKey) && cfg.queryKey[0] !== "userSocial",
      )?.[0];

      expect(booksCall.retry(0)).toBe(true);
      expect(booksCall.retry(1)).toBe(true);
      expect(booksCall.retry(2)).toBe(false);
      expect(booksCall.retryDelay).toBe(1000);
    });

    it("does not retry when user is logged out", () => {
      setupHook({ bookId: "b-1" });

      const booksCall = (useQuery as Mock).mock.calls.find(
        ([cfg]) => Array.isArray(cfg?.queryKey) && cfg.queryKey[0] !== "userSocial",
      )?.[0];

      expect(booksCall.retry(0)).toBe(false);
    });

    it("queryFn throws sync error for logged-in specific-book search with empty response", async () => {
      (useIsLoggedIn as unknown as Mock).mockReturnValue(true);
      (useUserStore as unknown as Mock).mockImplementation((selector) =>
        selector({ user: { id: "1", display_name: "Matheus" } }),
      );
      (BookService.prototype.getAll as Mock).mockResolvedValueOnce({
        data: [],
        total: 0,
      });
      setupHook({ bookId: "book-1", myBooks: true });

      const booksCall = (useQuery as Mock).mock.calls.find(
        ([cfg]) => Array.isArray(cfg?.queryKey) && cfg.queryKey[0] !== "userSocial",
      )?.[0];

      await expect(booksCall.queryFn()).rejects.toThrow("Sincronizando novo livro...");
    });

    it("queryFn returns response for logged-in users when data exists", async () => {
      (useIsLoggedIn as unknown as Mock).mockReturnValue(true);
      (useUserStore as unknown as Mock).mockImplementation((selector) =>
        selector({ user: { id: "1", display_name: "Matheus" } }),
      );
      const response = { data: [{ id: "ok" }], total: 1 };
      (BookService.prototype.getAll as Mock).mockResolvedValueOnce(response);
      setupHook({ myBooks: true });

      const booksCall = (useQuery as Mock).mock.calls.find(
        ([cfg]) => Array.isArray(cfg?.queryKey) && cfg.queryKey[0] !== "userSocial",
      )?.[0];

      await expect(booksCall.queryFn()).resolves.toEqual(response);
    });

    it("queryFn returns API response for logged-out users", async () => {
      const expectedResponse = { data: [{ id: "a" }], total: 1 };
      (BookService.prototype.getAll as Mock).mockResolvedValueOnce(expectedResponse);
      setupHook({ view: "todos" });

      const booksCall = (useQuery as Mock).mock.calls.find(
        ([cfg]) => Array.isArray(cfg?.queryKey) && cfg.queryKey[0] !== "userSocial",
      )?.[0];

      await expect(booksCall.queryFn()).resolves.toEqual(expectedResponse);
    });
  });

  describe("prefetch next page", () => {
    it("prefetches next page when myBooks is active and there is a next page", () => {
      (useIsLoggedIn as unknown as Mock).mockReturnValue(true);
      (useUserStore as unknown as Mock).mockImplementation((selector) =>
        selector({ user: { id: "1", display_name: "Matheus" } }),
      );
      (useUser as Mock).mockReturnValue({
        users: mockUsers,
        isLoadingUsers: false,
      });
      mockQueryData(9);

      setupHook({ myBooks: true });

      expect(mockPrefetchQuery).toHaveBeenCalledTimes(1);
      expect(mockPrefetchQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          staleTime: 1000 * 60 * 5,
          queryKey: QUERY_KEYS.books.list(
            { ...INITIAL_FILTERS, myBooks: true, readers: [] },
            "",
            1,
            "1",
          ),
        }),
      );
    });

    it("does not prefetch when not in myBooks mode", () => {
      mockQueryData(17);
      setupHook({ myBooks: false, view: "todos" });

      expect(mockPrefetchQuery).not.toHaveBeenCalled();
    });

    it("prefetch queryFn fetches next page with PAGE_SIZE=8", async () => {
      (useIsLoggedIn as unknown as Mock).mockReturnValue(true);
      (useUserStore as unknown as Mock).mockImplementation((selector) =>
        selector({ user: { id: "1", display_name: "Matheus" } }),
      );
      (BookService.prototype.getAll as Mock).mockResolvedValueOnce({
        data: [{ id: "next" }],
        total: 9,
      });
      mockQueryData(9);
      setupHook({ myBooks: true });

      const prefetchConfig = mockPrefetchQuery.mock.calls[0][0];
      await prefetchConfig.queryFn();

      expect(BookService.prototype.getAll).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          pageSize: 8,
          userId: "1",
        }),
      );
    });
  });

});
