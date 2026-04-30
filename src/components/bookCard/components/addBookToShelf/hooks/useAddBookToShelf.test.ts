import { act, renderHook } from "@testing-library/react";
import { Mock, vi } from "vitest";
import { useAddBookToShelf } from "./useAddBookToShelf";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock("@/modules/shelves/services/booksshelves.service", () => ({
  fetchBookShelves: vi.fn(),
  BookshelfService: vi.fn().mockImplementation(() => ({
    addBookToShelf: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/stores/hooks/useAuth", () => ({
  useIsLoggedIn: vi.fn(() => true),
}));

const mockPush = vi.fn();
const mockInvalidateQueries = vi.fn();
const mockMutate = vi.fn();

function setupMocks({
  bookshelves = [],
  isLoading = false,
  isPending = false,
  mutateImpl = mockMutate,
  isLoggedIn = true,
}: {
  bookshelves?: {
    id: string;
    name: string;
    books?: { id: string; imageUrl: string }[];
  }[];
  isLoading?: boolean;
  isPending?: boolean;
  mutateImpl?: Mock;
  isLoggedIn?: boolean;
} = {}) {
  (useIsLoggedIn as Mock).mockReturnValue(isLoggedIn);
  (useRouter as Mock).mockReturnValue({ push: mockPush });
  (useQueryClient as Mock).mockReturnValue({
    invalidateQueries: mockInvalidateQueries,
  });
  (useQuery as Mock).mockReturnValue({ data: bookshelves, isLoading });
  (useMutation as Mock).mockImplementation(({ onSuccess }) => ({
    mutate: mutateImpl,
    isPending,
    onSuccess,
  }));
}

const defaultProps = {
  isOpen: true,
  handleClose: vi.fn(),
  bookId: "book-abc",
};

describe("useAddBookToShelf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();
  });

  describe("bookshelfOptions", () => {
    it("returns empty options array when bookshelves data is empty", () => {
      setupMocks({ bookshelves: [] });
      const { result } = renderHook(() => useAddBookToShelf(defaultProps));
      expect(result.current.bookshelfOptions).toEqual([]);
    });

    it("maps bookshelves to { label, value } using name and id", () => {
      setupMocks({
        bookshelves: [
          { id: "shelf-1", name: "Minha Estante" },
          { id: "shelf-2", name: "Favoritos" },
        ],
      });
      const { result } = renderHook(() => useAddBookToShelf(defaultProps));
      expect(result.current.bookshelfOptions).toEqual([
        { label: "Minha Estante", value: "shelf-1" },
        { label: "Favoritos", value: "shelf-2" },
      ]);
    });

    it("returns empty options when useQuery returns undefined data", () => {
      (useQuery as Mock).mockReturnValue({ data: undefined, isLoading: false });
      const { result } = renderHook(() => useAddBookToShelf(defaultProps));
      expect(result.current.bookshelfOptions).toEqual([]);
    });

    it("maps multiple shelves preserving order", () => {
      const shelves = [
        { id: "a", name: "Alpha", books: [] },
        { id: "b", name: "Beta", books: [] },
        { id: "c", name: "Gamma", books: [] },
      ];
      setupMocks({ bookshelves: shelves });
      const { result } = renderHook(() => useAddBookToShelf(defaultProps));
      expect(result.current.bookshelfOptions).toHaveLength(3);
      expect(result.current.bookshelfOptions[2]).toEqual({
        label: "Gamma",
        value: "c",
      });
    });

    it("omite estantes que ja contem o livro do select", () => {
      setupMocks({
        bookshelves: [
          {
            id: "shelf-keep",
            name: "Livre",
            books: [],
          },
          {
            id: "shelf-has-book",
            name: "Cheia",
            books: [{ id: "book-abc", imageUrl: "" }],
          },
        ],
      });
      const { result } = renderHook(() => useAddBookToShelf(defaultProps));
      expect(result.current.bookshelfOptions).toEqual([
        { label: "Livre", value: "shelf-keep" },
      ]);
    });
  });

  describe("isLoading state", () => {
    it("exposes isLoading true while bookshelves are being fetched", () => {
      setupMocks({ isLoading: true });
      const { result } = renderHook(() => useAddBookToShelf(defaultProps));
      expect(result.current.isLoading).toBe(true);
    });

    it("exposes isLoading false when bookshelves have loaded", () => {
      setupMocks({ isLoading: false });
      const { result } = renderHook(() => useAddBookToShelf(defaultProps));
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("isPending state", () => {
    it("exposes isPending false when no mutation is running", () => {
      setupMocks({ isPending: false });
      const { result } = renderHook(() => useAddBookToShelf(defaultProps));
      expect(result.current.isPending).toBe(false);
    });

    it("exposes isPending true while mutation is in-flight", () => {
      setupMocks({ isPending: true });
      const { result } = renderHook(() => useAddBookToShelf(defaultProps));
      expect(result.current.isPending).toBe(true);
    });
  });

  describe("selectedShelfId state", () => {
    it("initialises selectedShelfId as empty string", () => {
      const { result } = renderHook(() => useAddBookToShelf(defaultProps));
      expect(result.current.selectedShelfId).toBe("");
    });

    it("updates selectedShelfId when setSelectedShelfId is called", () => {
      const { result } = renderHook(() => useAddBookToShelf(defaultProps));
      act(() => result.current.setSelectedShelfId("shelf-1"));
      expect(result.current.selectedShelfId).toBe("shelf-1");
    });

    it("can clear selectedShelfId back to empty string", () => {
      const { result } = renderHook(() => useAddBookToShelf(defaultProps));
      act(() => result.current.setSelectedShelfId("shelf-1"));
      act(() => result.current.setSelectedShelfId(""));
      expect(result.current.selectedShelfId).toBe("");
    });
  });

  describe("handleSubmit", () => {
    it("does NOT call mutate when selectedShelfId is empty", () => {
      const { result } = renderHook(() => useAddBookToShelf(defaultProps));
      act(() => result.current.handleSubmit());
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it("calls mutate when selectedShelfId is set", () => {
      const { result } = renderHook(() => useAddBookToShelf(defaultProps));
      act(() => result.current.setSelectedShelfId("shelf-1"));
      act(() => result.current.handleSubmit());
      expect(mockMutate).toHaveBeenCalledTimes(1);
    });

    it("does not call mutate more than once per submit", () => {
      const { result } = renderHook(() => useAddBookToShelf(defaultProps));
      act(() => result.current.setSelectedShelfId("shelf-1"));
      act(() => result.current.handleSubmit());
      expect(mockMutate).toHaveBeenCalledTimes(1);
    });

    it("does not throw when called with empty selectedShelfId", () => {
      const { result } = renderHook(() => useAddBookToShelf(defaultProps));
      expect(() => act(() => result.current.handleSubmit())).not.toThrow();
    });
  });

  describe("RN18 — guard de autenticação", () => {
    it("passa enabled: false para useQuery quando não está logado", () => {
      setupMocks({ isLoggedIn: false });
      renderHook(() => useAddBookToShelf(defaultProps));
      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: false }),
      );
    });

    it("passa enabled: true para useQuery quando está logado e o diálogo está aberto", () => {
      setupMocks({ isLoggedIn: true });
      renderHook(() => useAddBookToShelf(defaultProps));
      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: true }),
      );
    });

    it("passa enabled: false para useQuery quando está logado mas o diálogo está fechado (isOpen: false)", () => {
      setupMocks({ isLoggedIn: true });
      renderHook(() =>
        useAddBookToShelf({ ...defaultProps, isOpen: false }),
      );
      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: false }),
      );
    });

    it("retorna bookshelfOptions vazio quando não está logado", () => {
      (useIsLoggedIn as Mock).mockReturnValue(false);
      (useQuery as Mock).mockReturnValue({ data: undefined, isLoading: false });
      (useMutation as Mock).mockImplementation(() => ({
        mutate: mockMutate,
        isPending: false,
      }));
      (useRouter as Mock).mockReturnValue({ push: mockPush });
      (useQueryClient as Mock).mockReturnValue({ invalidateQueries: mockInvalidateQueries });

      const { result } = renderHook(() => useAddBookToShelf(defaultProps));
      expect(result.current.bookshelfOptions).toEqual([]);
    });
  });

  describe("RN19 — staleTime em queries compartilhadas", () => {
    it("declara staleTime de 5 minutos (300000ms)", () => {
      setupMocks();
      renderHook(() => useAddBookToShelf(defaultProps));
      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({ staleTime: 1000 * 60 * 5 }),
      );
    });

    it("usa queryKey [\"bookshelves\"] para compartilhar cache", () => {
      setupMocks();
      renderHook(() => useAddBookToShelf(defaultProps));
      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ["bookshelves"] }),
      );
    });
  });

  describe("edge cases", () => {
    it("works correctly with different bookIds passed as prop", () => {
      const { result } = renderHook(() =>
        useAddBookToShelf({ ...defaultProps, bookId: "book-xyz" }),
      );
      act(() => result.current.setSelectedShelfId("shelf-1"));
      act(() => result.current.handleSubmit());
      expect(mockMutate).toHaveBeenCalled();
    });

    it("handles shelf with very long name without errors", () => {
      const longName = "A".repeat(200);
      setupMocks({ bookshelves: [{ id: "shelf-long", name: longName }] });
      const { result } = renderHook(() => useAddBookToShelf(defaultProps));
      expect(result.current.bookshelfOptions[0].label).toBe(longName);
    });

    it("re-renders correctly when isOpen prop changes", () => {
      const { result, rerender } = renderHook(
        ({ isOpen }) => useAddBookToShelf({ ...defaultProps, isOpen }),
        { initialProps: { isOpen: false } },
      );
      rerender({ isOpen: true });
      expect(result.current.bookshelfOptions).toBeDefined();
    });
  });
});
