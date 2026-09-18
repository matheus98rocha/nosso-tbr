import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import type { BookDomain } from "@/types/books.types";

import { useAddBookToLibrary } from "./useAddBookToLibrary";

const createMock = vi.hoisted(() => vi.fn());
const findCatalogBookMatchMock = vi.hoisted(() => vi.fn());
const linkReaderToExistingBookMock = vi.hoisted(() => vi.fn());

vi.mock("sonner", () => ({ toast: vi.fn() }));
vi.mock("@/stores/userStore", () => ({
  useUserStore: vi.fn((selector: (state: { user: { id: string } }) => unknown) =>
    selector({ user: { id: "user-123" } }),
  ),
}));
vi.mock("@/modules/bookUpsert/services/bookUpsert.service", () => ({
  BookUpsertService: vi.fn(function BookUpsertServiceMock() {
    return {
      create: createMock,
      findCatalogBookMatch: findCatalogBookMatchMock,
      linkReaderToExistingBook: linkReaderToExistingBookMock,
    };
  }),
}));

const book: BookDomain = {
  id: "other-book",
  title: "Memórias Póstumas",
  author: "Machado de Assis",
  authorId: "author-1",
  chosen_by: "other-user",
  pages: 160,
  readerIds: ["other-user"],
  readersDisplay: "Outra pessoa",
  status: "finished",
  gender: "romance",
  image_url: "https://m.media-amazon.com/images/I/cover.jpg",
  user_id: "other-user",
  is_reread: false,
  is_favorite: false,
};

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
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

describe("useAddBookToLibrary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findCatalogBookMatchMock.mockResolvedValue(null);
    createMock.mockResolvedValue({ id: "new-book" });
  });

  it("cria uma cópia própria quando o usuário ainda não participa do título", async () => {
    const { Wrapper, client } = createWrapper();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const { result } = renderHook(
      () => useAddBookToLibrary({ book, enabled: true }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.addToLibrary();
    });

    await waitFor(() => {
      expect(createMock).toHaveBeenCalledTimes(1);
    });

    expect(findCatalogBookMatchMock).toHaveBeenCalledWith({
      title: "Memórias Póstumas",
      authorId: "author-1",
      currentUserId: "user-123",
    });
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Memórias Póstumas",
        author_id: "author-1",
        user_id: "user-123",
        chosen_by: "user-123",
        readers: ["user-123"],
        status: "not_started",
        is_reread: false,
      }),
    );
    expect(toast).toHaveBeenCalledWith("Livro adicionado à sua biblioteca!");
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["books"],
      exact: false,
    });
  });

  it("não cria duplicata quando o usuário já participa do título (RN49)", async () => {
    findCatalogBookMatchMock.mockResolvedValue({ userAlreadyLinked: true });
    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () => useAddBookToLibrary({ book, enabled: true }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.addToLibrary();
    });

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith("Não foi possível adicionar o livro", {
        description: "Este livro já está na sua biblioteca.",
        className: "toast-error",
      });
    });

    expect(createMock).not.toHaveBeenCalled();
  });

  it("cria cópia nova mesmo se o catálogo sugeriria participar da leitura existente", async () => {
    findCatalogBookMatchMock.mockResolvedValue({
      userAlreadyLinked: false,
      suggestJoinEligible: true,
    });
    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () => useAddBookToLibrary({ book, enabled: true }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.addToLibrary();
    });

    await waitFor(() => {
      expect(createMock).toHaveBeenCalledTimes(1);
    });

    expect(linkReaderToExistingBookMock).not.toHaveBeenCalled();
  });

  it("não dispara criação quando a ação está desabilitada", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () => useAddBookToLibrary({ book, enabled: false }),
      { wrapper: Wrapper },
    );

    act(() => {
      result.current.addToLibrary();
    });

    expect(findCatalogBookMatchMock).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
  });
});
