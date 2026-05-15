import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import React from "react";
import { useBookshelfBookOrder } from "./useBookshelfBookOrder";
import type { BookDomain } from "@/types/books.types";
import { bookshelfBooksQueryKey } from "@/modules/bookshelves/bookshelfBooksQueryKey";

const book = (id: string): BookDomain => ({
  id,
  title: "T",
  author: "A",
  chosen_by: "u",
  pages: 1,
  readerIds: [],
  readersDisplay: "",
  gender: null,
  image_url: "/x.svg",
  user_id: "u",
  is_reread: false,
  is_favorite: false,
});

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

vi.mock("@/modules/bookshelves/services/bookshelvesBooks.service", () => ({
  BookshelfServiceBooks: class {
    reorderBooksOnShelf = vi.fn().mockResolvedValue(undefined);
  },
}));

function wrapper(client: QueryClient) {
  return function W({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

describe("useBookshelfBookOrder", () => {
  it("applyReorder updates cache when order is a valid permutation", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.spyOn(client, "invalidateQueries").mockResolvedValue(undefined as never);
    const books = [book("a"), book("b")];
    client.setQueryData(bookshelfBooksQueryKey("s1"), books);

    const { result } = renderHook(() => useBookshelfBookOrder("s1"), {
      wrapper: wrapper(client),
    });

    await act(async () => {
      result.current.applyReorder(books, ["b", "a"]);
    });

    expect(
      client
        .getQueryData<BookDomain[]>(bookshelfBooksQueryKey("s1"))
        ?.map((x) => x.id),
    ).toEqual(["b", "a"]);
  });
});
