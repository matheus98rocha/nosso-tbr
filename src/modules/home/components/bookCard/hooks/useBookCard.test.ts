import { renderHook, act } from "@testing-library/react";
import { vi, Mock } from "vitest";
import { useBookCard } from "./useBookCard";
import { BookDomain } from "@/types/books.types";
import { BookService } from "@/services/books/books.service";
import { BookshelfServiceBooks } from "@/modules/bookshelves/services/bookshelvesBooks.service";
import { useRouter } from "next/navigation";

vi.mock("next/navigation", () => ({ useRouter: vi.fn() }));
vi.mock("@/services/books/books.service");
vi.mock("@/modules/bookshelves/services/bookshelvesBooks.service");
vi.mock("@/hooks/useModal", () => ({
  useModal: () => ({ setIsOpen: vi.fn() }),
}));
vi.mock("@/stores/hooks/useAuth", () => ({ useIsLoggedIn: () => true }));
vi.mock("@/hooks/useSafeTap", () => ({ useSafeTap: (fn: () => void) => fn }));

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

// Helper para renderizar hook
const renderBookCardHook = (book = baseBook) =>
  renderHook(() => useBookCard({ book }));

describe("useBookCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Badge Object", () => {
    it("should return correct badge for not_started", () => {
      const { result } = renderBookCardHook({
        ...baseBook,
        status: "not_started",
      });
      expect(result.current.badgeObject.bookStatusClass).toBe(
        "bg-gray-500 text-white"
      );
      expect(result.current.badgeObject.bookStatusText).toBe(
        "Vou iniciar a leitura"
      );
    });

    it("should return correct badge for reading", () => {
      const { result } = renderBookCardHook({ ...baseBook, status: "reading" });
      expect(result.current.badgeObject.bookStatusClass).toBe(
        "bg-green-800 text-white"
      );
      expect(result.current.badgeObject.bookStatusText).toBe(
        "Já iniciei a leitura"
      );
    });

    it("should return correct badge for finished", () => {
      const { result } = renderBookCardHook({
        ...baseBook,
        status: "finished",
      });
      expect(result.current.badgeObject.bookStatusClass).toBe(
        "bg-red-500 text-white"
      );
      expect(result.current.badgeObject.bookStatusText).toBe(
        "Terminei a Leitura"
      );
    });

    it("should fallback to not_started for undefined status", () => {
      const { result } = renderBookCardHook({ ...baseBook, status: undefined });
      expect(result.current.badgeObject.bookStatusClass).toBe(
        "bg-gray-500 text-white"
      );
      expect(result.current.badgeObject.bookStatusText).toBe(
        "Vou iniciar a leitura"
      );
    });
  });

  describe("handleConfirmDelete", () => {
    it("should call BookService.delete when isShelf is false", async () => {
      const deleteMock = vi.fn();
      (BookService as unknown as Mock).mockImplementation(
        () => ({ delete: deleteMock } as unknown)
      );
      const { result } = renderBookCardHook();
      await act(async () => result.current.handleConfirmDelete("123", false));
      expect(deleteMock).toHaveBeenCalledWith("123");
    });

    it("should call removeBookFromShelf and reload when isShelf is true", async () => {
      const removeMock = vi.fn();
      (BookshelfServiceBooks as unknown as Mock).mockImplementation(
        () =>
          ({
            removeBookFromShelf: removeMock,
          } as unknown)
      );
      const { result } = renderBookCardHook();
      await act(async () => result.current.handleConfirmDelete("123", true));
      expect(removeMock).toHaveBeenCalledWith("123");
    });
  });

  describe("Navigation", () => {
    it("should navigate to schedule", () => {
      const pushMock = vi.fn();
      (useRouter as Mock).mockReturnValue({ push: pushMock });
      const { result } = renderBookCardHook();
      act(() => result.current.handleNavigateToSchedule());
      expect(pushMock).toHaveBeenCalledWith("/schedule/1/2024-01-01/Test Book");
    });

    it("should navigate to quotes", () => {
      const pushMock = vi.fn();
      (useRouter as Mock).mockReturnValue({ push: pushMock });
      const { result } = renderBookCardHook();
      act(() => result.current.handleNavigateToQuotes());
      expect(pushMock).toHaveBeenCalledWith("/quotes/Test Book/1");
    });
  });

  describe("shareOnWhatsApp", () => {
    beforeEach(() => {
      vi.spyOn(window, "open").mockImplementation(() => null);
    });
    afterEach(() => {
      vi.restoreAllMocks();
    });
    it("deve abrir o link correto no WhatsApp", () => {
      // 1. Renderiza o hook customizado com os dados de um livro base.
      const { result } = renderHook(() =>
        useBookCard({ book: { ...baseBook } })
      );

      // 2. Executa a função de compartilhamento no WhatsApp.
      act(() => {
        result.current.shareOnWhatsApp();
      });

      // Variáveis para construir o link
      const baseUrl = "https://nosso-tbr.vercel.app/";
      const encodedTitle = encodeURIComponent(baseBook.title);

      // O link da página que será compartilhado (com o título codificado)
      const shareUrl = `${baseUrl}?search=${encodedTitle}`;

      // O link final do WhatsApp, que deve codificar a 'shareUrl'
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareUrl)}`;

      // 3. Verifica se a função window.open foi chamada com o link de destino correto.
      expect(window.open).toHaveBeenCalledWith(whatsappUrl, "_blank");
    });
  });
});
