import { renderHook, act } from "@testing-library/react";
import { Mock, vi } from "vitest";
import { useBookCard } from "./useBookCard";
import { BookDomain } from "@/types/books.types";
import { BookService } from "@/services/books/books.service";
import { BookshelfServiceBooks } from "@/modules/bookshelves/services/bookshelvesBooks.service";

vi.mock("@/services/books/books.service");
vi.mock("@/modules/bookshelves/services/bookshelvesBooks.service");

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("@/hooks/useModal", () => ({
  useModal: vi.fn(() => ({
    isOpen: false,
    setIsOpen: vi.fn(),
    open: vi.fn(),
    close: vi.fn(),
  })),
}));

vi.mock("@/stores/hooks/useAuth", () => ({
  useIsLoggedIn: vi.fn(() => true),
}));

vi.mock("@/hooks/useSafeTap", () => ({
  useSafeTap: (fn: () => void) => fn,
}));

describe("useBookCard", () => {
  const baseBook: BookDomain = {
    id: "1",
    title: "Test Book",
    author: "Test Author",
    chosen_by: "Matheus",
    pages: 300,
    readers: "Matheus e Barbara",
    start_date: "2024-01-01",
    end_date: null,
    gender: "Fiction",
    image_url: "https://example.com/test.jpg",
    user_id: "user-123",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize modals and return expected structure", () => {
    const { result } = renderHook(() =>
      useBookCard({ book: { ...baseBook, status: "not_started" } })
    );

    expect(result.current.dropdownModal).toBeDefined();
    expect(result.current.dialogEditModal).toBeDefined();
    expect(result.current.dialogDeleteModal).toBeDefined();
    expect(result.current.dialogAddShelfModal).toBeDefined();
    expect(result.current.isLogged).toBe(true);
  });

  describe("Badge Object", () => {
    it("should set badges correctly when the book is not started", () => {
      const { result } = renderHook(() =>
        useBookCard({ book: { ...baseBook, status: "not_started" } })
      );

      expect(result.current.badgeObject.bookStatusClass).toBe(
        "bg-gray-500 text-white"
      );
      expect(result.current.badgeObject.bookStatusText).toBe(
        "Vou iniciar a leitura"
      );
    });

    it("should set badges correctly when the book is reading", () => {
      const { result } = renderHook(() =>
        useBookCard({ book: { ...baseBook, status: "reading" } })
      );

      expect(result.current.badgeObject.bookStatusClass).toBe(
        "bg-green-800 text-white"
      );
      expect(result.current.badgeObject.bookStatusText).toBe(
        "Já iniciei a leitura"
      );
    });

    it("should set badges correctly when the book is finished", () => {
      const { result } = renderHook(() =>
        useBookCard({ book: { ...baseBook, status: "finished" } })
      );

      expect(result.current.badgeObject.bookStatusClass).toBe(
        "bg-red-500 text-white"
      );
      expect(result.current.badgeObject.bookStatusText).toBe(
        "Terminei a Leitura"
      );
    });
  });

  describe("handleConfirmDelete", () => {
    const id = "123";

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should call BookService.delete when isShelf is false", async () => {
      const deleteMock = vi.fn();
      (BookService as unknown as Mock).mockImplementation(
        () =>
          ({
            delete: deleteMock,
          } as unknown)
      );

      const { result } = renderHook(() =>
        useBookCard({ book: { ...baseBook, status: "not_started" } })
      );

      await act(async () => {
        await result.current.handleConfirmDelete(id, false);
      });

      expect(deleteMock).toHaveBeenCalledWith(id);
    });

    it("should call BookshelfServiceBooks.removeBookFromShelf and reload when isShelf is true", async () => {
      const removeMock = vi.fn();

      (BookshelfServiceBooks as unknown as Mock).mockImplementation(
        () =>
          ({
            removeBookFromShelf: removeMock,
          } as unknown)
      );

      const reloadMock = vi.fn();
      Object.defineProperty(window, "location", {
        value: { reload: reloadMock },
        writable: true,
      });

      const { result } = renderHook(() =>
        useBookCard({ book: { ...baseBook, status: "not_started" } })
      );

      await act(async () => {
        await result.current.handleConfirmDelete(id, true);
      });

      expect(removeMock).toHaveBeenCalledWith(id);
      expect(reloadMock).toHaveBeenCalled();
    });
  });
});
