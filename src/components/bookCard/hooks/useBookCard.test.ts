import { renderHook, act } from "@testing-library/react";
import { vi, Mock } from "vitest";
import { useBookCard } from "./useBookCard";
import { BookDomain } from "@/types/books.types";
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
  chosen_by: "11111111-1111-4111-8111-111111111111",
  pages: 300,
  readerIds: ["11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222"],
  readersDisplay: "Matheus e Barbara",
  start_date: "2024-01-01",
  end_date: null,
  gender: "Fiction",
  image_url: "https://example.com/test.jpg",
  user_id: "user-123",
};

const renderBookCardHook = (book = baseBook) =>
  renderHook(() => useBookCard({ book }));

describe("useBookCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useBookCard", () => {
    describe("Badge Object", () => {
      it("should return correct badge for not_started", () => {
        const { result } = renderBookCardHook({
          ...baseBook,
          status: "not_started",
        });
        expect(result.current.badgeObject.bookStatusClass).toBe(
          "bg-gray-500 text-white",
        );
        expect(result.current.badgeObject.bookStatusText).toBe(
          "Ainda não iniciei a leitura",
        );
      });

      it("should return correct badge for reading", () => {
        const { result } = renderBookCardHook({
          ...baseBook,
          status: "reading",
        });
        expect(result.current.badgeObject.bookStatusClass).toBe(
          "bg-green-800 text-white",
        );
        expect(result.current.badgeObject.bookStatusText).toBe(
          "Já iniciei a leitura",
        );
      });

      it("should return correct badge for planned", () => {
        const { result } = renderBookCardHook({
          ...baseBook,
          status: "planned",
        });
        expect(result.current.badgeObject.bookStatusClass).toBe(
          "bg-gray-500 text-white",
        );
        expect(result.current.badgeObject.bookStatusText).toBe(
          "Ainda não iniciei a leitura",
        );
      });

      it("should return correct badge for paused", () => {
        const { result } = renderBookCardHook({
          ...baseBook,
          status: "paused",
        });
        expect(result.current.badgeObject.bookStatusClass).toBe(
          "bg-violet-600 text-white",
        );
        expect(result.current.badgeObject.bookStatusText).toBe(
          "Leitura pausada",
        );
      });

      it("should return correct badge for abandoned", () => {
        const { result } = renderBookCardHook({
          ...baseBook,
          status: "abandoned",
        });
        expect(result.current.badgeObject.bookStatusClass).toBe(
          "bg-rose-600 text-white",
        );
        expect(result.current.badgeObject.bookStatusText).toBe(
          "Livro abandonado",
        );
      });

      it("should return correct badge for finished", () => {
        const { result } = renderBookCardHook({
          ...baseBook,
          status: "finished",
        });
        expect(result.current.badgeObject.bookStatusClass).toBe(
          "bg-red-500 text-white",
        );
        expect(result.current.badgeObject.bookStatusText).toBe(
          "Terminei a Leitura",
        );
      });

      it("should fallback to not_started for undefined status", () => {
        const { result } = renderBookCardHook({
          ...baseBook,
          status: undefined,
        });
        expect(result.current.badgeObject.bookStatusClass).toBe(
          "bg-gray-500 text-white",
        );
        expect(result.current.badgeObject.bookStatusText).toBe(
          "Ainda não iniciei a leitura",
        );
      });
    });

    describe("Navigation", () => {
      it("should navigate to schedule", () => {
        const pushMock = vi.fn();
        (useRouter as Mock).mockReturnValue({ push: pushMock });
        const { result } = renderBookCardHook();
        act(() => result.current.handleNavigateToSchedule());
        expect(pushMock).toHaveBeenCalledWith("/schedule/1/Test Book");
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
        const { result } = renderHook(() =>
          useBookCard({ book: { ...baseBook } }),
        );

        act(() => {
          result.current.shareOnWhatsApp();
        });

        const baseUrl = "https://nosso-tbr.vercel.app/";
        const encodedTitle = encodeURIComponent(baseBook.title);
        const shareUrl = `${baseUrl}?search=${encodedTitle}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareUrl)}`;

        expect(window.open).toHaveBeenCalledWith(whatsappUrl, "_blank");
      });
    });
  });
});
