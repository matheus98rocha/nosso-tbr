"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/keys";
import { BookService } from "@/services/books/books.service";
import { useUserStore } from "@/stores/userStore";
import type { FiltersOptions } from "@/types/filters";

import type { FocusBook, FocusPageProgress } from "../../types/focus.types";

const FOCUS_BOOK_FILTERS: FiltersOptions = {
  readers: [],
  status: ["reading"],
  gender: [],
  view: "todos",
  userId: "",
  bookId: "",
  authorId: "",
  year: undefined,
  myBooks: false,
  focusReaderId: "",
};

const bookService = new BookService();
const FETCH_SIZE = 48;

export function useFocusBooks(pages: FocusPageProgress) {
  const userId = useUserStore((state) => state.user?.id);

  const query = useQuery({
    queryKey: [...QUERY_KEYS.books.all, "focus", userId ?? "anon"] as const,
    queryFn: () =>
      bookService.getAll({
        relationshipUserValues: userId ? [userId] : undefined,
        filters: FOCUS_BOOK_FILTERS,
        page: 0,
        pageSize: FETCH_SIZE,
      }),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: false,
  });

  const books = useMemo<FocusBook[]>(
    () =>
      (query.data?.data ?? [])
        .filter((book) => typeof book.id === "string")
        .map((book) => ({
          id: book.id as string,
          title: book.title,
          author: book.author || "Autor desconhecido",
          authorIds: book.authorIds ?? (book.authorId ? [book.authorId] : []),
          imageUrl: book.image_url,
          pages: book.pages,
          currentPage: Math.min(book.pages, pages[book.id as string] ?? 1),
          readerIds: [...book.readerIds],
          chosenBy: book.chosen_by,
          userId: book.user_id,
          startDate: book.start_date ?? null,
          gender: book.gender ?? null,
          isReread: book.is_reread,
          status: book.status ?? "reading",
        })),
    [query.data?.data, pages],
  );

  return {
    books,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
