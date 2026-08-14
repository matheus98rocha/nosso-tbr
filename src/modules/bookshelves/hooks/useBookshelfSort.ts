import { useMemo } from "react";
import type { BookDomain } from "@/types/books.types";
import { applyBookshelfDisplaySort } from "../utils/bookshelfBooksSort";
import { useBookshelfSortPreference } from "./useBookshelfSortPreference";

export function useBookshelfSort(books: BookDomain[]) {
  const { sort, handleSetSort } = useBookshelfSortPreference();

  const sortedBooks = useMemo(
    () => applyBookshelfDisplaySort(books, sort),
    [books, sort],
  );

  const isSortActive = useMemo(() => Boolean(sort), [sort]);

  return {
    sort,
    sortedBooks,
    isSortActive,
    handleSetSort,
  };
}
