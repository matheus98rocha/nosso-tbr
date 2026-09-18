import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { Mock, vi } from "vitest";
import { useBookCard } from "./useBookCard";
import type { BookCardProps } from "../types/bookCard.types";
import { BookDomain } from "@/types/books.types";
import { useRouter } from "next/navigation";
import { BookService } from "@/services/books/books.service";
import { BookshelfServiceBooks } from "@/modules/bookshelves/services/bookshelvesBooks.service";

vi.mock("next/navigation", () => ({ useRouter: vi.fn() }));
vi.mock("@/services/books/books.service");
vi.mock("@/modules/bookshelves/services/bookshelvesBooks.service");
vi.mock("@/hooks/useModal", () => ({
  useModal: () => ({ setIsOpen: vi.fn() }),
}));
const toggleFavoriteMock = vi.hoisted(() => vi.fn());
const isLoggedInMock = vi.hoisted(() => ({ value: true }));

vi.mock("@/stores/hooks/useAuth", () => ({
  useIsLoggedIn: () => isLoggedInMock.value,
}));
vi.mock("@/stores/userStore", () => ({
  useUserStore: vi.fn((selector: (state: unknown) => unknown) =>
    selector({
      user: { id: "user-123" },
    }),
  ),
}));

vi.mock("@/services/bookFavorites/hooks/useToggleBookFavorite", () => ({
  useToggleBookFavorite: () => ({
    toggle: toggleFavoriteMock,
    isPending: false,
  }),
}));
vi.mock("@/hooks/useSafeTap", () => ({ useSafeTap: (fn: () => void) => fn }));
vi.mock("@/modules/bookUpsert/services/bookUpsert.service", () => ({
  BookUpsertService: vi.fn(function BookUpsertServiceMock() {
    return {
      edit: vi.fn().mockResolvedValue(undefined),
    };
  }),
}));
vi.mock("./useAddBookToLibrary", () => ({
  useAddBookToLibrary: () => ({
    addToLibrary: vi.fn(),
    isAddToLibraryPending: false,
  }),
}));

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  return {
    client,
    Wrapper({ children }: { children: ReactNode }) {
      return createElement(QueryClientProvider, { client }, children);
    },
  };
}

const baseBook: BookDomain = {
  id: "1",
  title: "Test Book",
  author: "Test Author",
  chosen_by: "11111111-1111-4111-8111-111111111111",
  pages: 300,
  readerIds: ["11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222"],
  readersDisplay: "Matheus e John Doe",
  start_date: "2024-01-01",
  end_date: null,
  gender: "Fiction",
  authorId: "author-1",
  image_url: "https://example.com/test.jpg",
  user_id: "user-123",
  is_reread: false,
  is_favorite: false,
};

const othersBook: BookDomain = {
  ...baseBook,
  user_id: "other-user",
  chosen_by: "other-user",
  readerIds: ["other-user"],
};

const renderBookCardHook = (
  book = baseBook,
  options?: {
    hideInteractions?: boolean;
    isShelf?: boolean;
    shelfId?: string;
  },
) => {
  const { Wrapper } = createWrapper();
  const hideInteractions = options?.hideInteractions;
  const props: BookCardProps =
    options?.isShelf === true
      ? {
          book,
          isShelf: true,
          shelfId: options.shelfId ?? "",
          hideInteractions,
        }
      : { book, hideInteractions };
  return renderHook(() => useBookCard(props), { wrapper: Wrapper });
};

describe("useBookCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isLoggedInMock.value = true;
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

      it("should show fallback label when finished without end_date", () => {
        const { result } = renderBookCardHook({
          ...baseBook,
          status: "finished",
          end_date: null,
        });
        expect(result.current.statusDisplay?.label).toBe("Leitura finalizada");
      });

      it("should show formatted end date when finished with end_date", () => {
        const { result } = renderBookCardHook({
          ...baseBook,
          status: "finished",
          end_date: "2024-06-15T12:00:00.000Z",
        });
        expect(result.current.statusDisplay?.label).toMatch(/^Finalizado em /);
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

    describe("handleConfirmDelete (RN55)", () => {
      it("when isShelf is true and shelfId is empty, throws (RN55 guard)", async () => {
        const { result } = renderBookCardHook(baseBook, {
          isShelf: true,
          shelfId: "",
        });
        await expect(
          result.current.handleConfirmDelete("1"),
        ).rejects.toThrow(/shelfId é obrigatório/);
      });

      it("when not shelf, deletes book and replaces route with home listing", async () => {
        const replaceMock = vi.fn();
        (useRouter as Mock).mockReturnValue({
          push: vi.fn(),
          replace: replaceMock,
        });
        const deleteMock = vi.fn().mockResolvedValue(undefined);
        vi.mocked(BookService).mockImplementation(
          class MockBookService {
            delete = deleteMock;
          } as unknown as typeof BookService,
        );

        const { result } = renderBookCardHook();

        await act(async () => {
          await result.current.handleConfirmDelete("1");
        });

        expect(deleteMock).toHaveBeenCalledWith("1");
        expect(replaceMock).toHaveBeenCalledWith("/");
      });

      it("when isShelf and shelfId is set, removes book from shelf only", async () => {
        const removeBookFromShelf = vi.fn().mockResolvedValue(undefined);
        vi.mocked(BookshelfServiceBooks).mockImplementation(
          class MockBookshelfBooks {
            removeBookFromShelf = removeBookFromShelf;
          } as unknown as typeof BookshelfServiceBooks,
        );
        (useRouter as Mock).mockReturnValue({
          push: vi.fn(),
          replace: vi.fn(),
        });

        const { result } = renderBookCardHook(baseBook, {
          isShelf: true,
          shelfId: "shelf-abc",
        });

        await act(async () => {
          await result.current.handleConfirmDelete("1");
        });

        expect(removeBookFromShelf).toHaveBeenCalledWith("shelf-abc", "1");
      });
    });

    describe("ações de dono (RN42 / RN59)", () => {
      it("exibe favoritar e menu quando o livro é do usuário e está finished", () => {
        const { result } = renderBookCardHook({
          ...baseBook,
          status: "finished",
        });

        expect(result.current.showFavoriteToggle).toBe(true);
        expect(result.current.showBookOptionsMenu).toBe(true);
      });

      it("exibe o menu, mas não o favoritar, quando o livro é do usuário e não está finished", () => {
        const { result } = renderBookCardHook({
          ...baseBook,
          status: "reading",
        });

        expect(result.current.showFavoriteToggle).toBe(false);
        expect(result.current.showBookOptionsMenu).toBe(true);
      });

      it("oculta favoritar e menu quando o usuário não participa do livro", () => {
        const { result } = renderBookCardHook({
          ...othersBook,
          status: "finished",
        });

        expect(result.current.showFavoriteToggle).toBe(false);
        expect(result.current.showBookOptionsMenu).toBe(false);
      });

      it("exibe favoritar e menu quando o usuário só aparece em readers", () => {
        const { result } = renderBookCardHook({
          ...othersBook,
          status: "finished",
          readerIds: ["user-123"],
        });

        expect(result.current.showFavoriteToggle).toBe(true);
        expect(result.current.showBookOptionsMenu).toBe(true);
      });

      it("oculta favoritar e menu com hideInteractions mesmo sendo dono", () => {
        const { result } = renderBookCardHook(
          { ...baseBook, status: "finished" },
          { hideInteractions: true },
        );

        expect(result.current.showFavoriteToggle).toBe(false);
        expect(result.current.showBookOptionsMenu).toBe(false);
      });

      it("exibe favoritar e menu quando o usuário só aparece em chosen_by", () => {
        const { result } = renderBookCardHook({
          ...othersBook,
          status: "finished",
          chosen_by: "user-123",
        });

        expect(result.current.showFavoriteToggle).toBe(true);
        expect(result.current.showBookOptionsMenu).toBe(true);
      });

      it("oculta favoritar e menu quando não há sessão", () => {
        isLoggedInMock.value = false;
        const { result } = renderBookCardHook({
          ...baseBook,
          status: "finished",
        });

        expect(result.current.showFavoriteToggle).toBe(false);
        expect(result.current.showBookOptionsMenu).toBe(false);
      });

      it("dispara toggle de favorito em livro finished do usuário", () => {
        const { result } = renderBookCardHook({
          ...baseBook,
          status: "finished",
        });

        act(() => {
          result.current.handleFavoriteClick();
        });

        expect(toggleFavoriteMock).toHaveBeenCalledWith("1", true);
      });

      it("não dispara toggle de favorito em livro do usuário que não está finished", () => {
        const { result } = renderBookCardHook({
          ...baseBook,
          status: "reading",
        });

        act(() => {
          result.current.handleFavoriteClick();
        });

        expect(toggleFavoriteMock).not.toHaveBeenCalled();
      });

      it("não dispara toggle de favorito em livro de outra pessoa", () => {
        const { result } = renderBookCardHook({
          ...othersBook,
          status: "finished",
        });

        act(() => {
          result.current.handleFavoriteClick();
        });

        expect(toggleFavoriteMock).not.toHaveBeenCalled();
      });
    });

    describe("card footer actions", () => {
      it("exibe ação de iniciar leitura para livros em not_started", () => {
        const { result } = renderBookCardHook({
          ...baseBook,
          status: "not_started",
        });

        expect(result.current.showStartReadingAction).toBe(true);
        expect(result.current.showReadingProgress).toBe(false);
        expect(result.current.showCardFooterAction).toBe(true);
      });

      it("exibe ação de iniciar leitura para livros em planned", () => {
        const { result } = renderBookCardHook({
          ...baseBook,
          status: "planned",
        });

        expect(result.current.showStartReadingAction).toBe(true);
        expect(result.current.showReadingProgress).toBe(false);
        expect(result.current.showCardFooterAction).toBe(true);
      });

      it("exibe ação de reiniciar leitura para livros em paused", () => {
        const { result } = renderBookCardHook({
          ...baseBook,
          status: "paused",
        });

        expect(result.current.showStartReadingAction).toBe(false);
        expect(result.current.showResumeReadingAction).toBe(true);
        expect(result.current.showReadingProgress).toBe(false);
        expect(result.current.cardReadingActionLabel).toBe("Reiniciar leitura");
        expect(result.current.showCardFooterAction).toBe(true);
      });

      it("exibe progresso de leitura para livros em reading", () => {
        const { result } = renderBookCardHook({
          ...baseBook,
          status: "reading",
        });

        expect(result.current.showStartReadingAction).toBe(false);
        expect(result.current.showReadingProgress).toBe(true);
        expect(result.current.showCardFooterAction).toBe(true);
      });

      it("não exibe adicionar à biblioteca no próprio livro", () => {
        const { result } = renderBookCardHook({
          ...baseBook,
          status: "not_started",
        });

        expect(result.current.showAddToLibrary).toBe(false);
        expect(result.current.showStartReadingAction).toBe(true);
      });

      it("oculta adicionar à biblioteca para visitante", () => {
        isLoggedInMock.value = false;
        const { result } = renderBookCardHook({
          ...othersBook,
          status: "finished",
        });

        expect(result.current.showAddToLibrary).toBe(false);
      });

      it("oculta adicionar à biblioteca quando pages é inválido", () => {
        const { result } = renderBookCardHook({
          ...othersBook,
          pages: 0,
        });

        expect(result.current.showAddToLibrary).toBe(false);
      });

      it("exibe adicionar à biblioteca e oculta iniciar leitura em livro de outra pessoa", () => {
        const { result } = renderBookCardHook({
          ...othersBook,
          status: "planned",
        });

        expect(result.current.showAddToLibrary).toBe(true);
        expect(result.current.showStartReadingAction).toBe(false);
        expect(result.current.showResumeReadingAction).toBe(false);
        expect(result.current.showReadingProgress).toBe(false);
        expect(result.current.showCardFooterAction).toBe(true);
      });

      it("oculta progresso e reinício em livro de outra pessoa", () => {
        const reading = renderBookCardHook({
          ...othersBook,
          status: "reading",
        });
        expect(reading.result.current.showReadingProgress).toBe(false);
        expect(reading.result.current.showAddToLibrary).toBe(true);

        const paused = renderBookCardHook({
          ...othersBook,
          status: "paused",
        });
        expect(paused.result.current.showResumeReadingAction).toBe(false);
        expect(paused.result.current.showAddToLibrary).toBe(true);
      });

      it("mantém adicionar à biblioteca no perfil mesmo com hideInteractions", () => {
        const { result } = renderBookCardHook(
          { ...othersBook, status: "finished" },
          { hideInteractions: true },
        );

        expect(result.current.showAddToLibrary).toBe(true);
        expect(result.current.showFavoriteToggle).toBe(false);
        expect(result.current.showBookOptionsMenu).toBe(false);
      });

      it("oculta adicionar à biblioteca na estante", () => {
        const { result } = renderBookCardHook(
          { ...othersBook, status: "finished" },
          { isShelf: true, shelfId: "shelf-abc" },
        );

        expect(result.current.showAddToLibrary).toBe(false);
      });

      it("oculta adicionar à biblioteca sem authorId", () => {
        const { result } = renderBookCardHook({
          ...othersBook,
          authorId: undefined,
        });

        expect(result.current.showAddToLibrary).toBe(false);
      });

      it("oculta ações do rodapé na estante", () => {
        const { result } = renderBookCardHook(
          { ...baseBook, status: "not_started" },
          { isShelf: true, shelfId: "shelf-abc" },
        );

        expect(result.current.showStartReadingAction).toBe(false);
        expect(result.current.showCardFooterAction).toBe(false);
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
        const { result } = renderBookCardHook();

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
