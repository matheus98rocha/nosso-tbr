import { useState, useCallback, useMemo } from "react";
import { SortOption } from "@/types/filters";
import { BookDomain } from "@/types/books.types";

export function useBookshelfSort(books: BookDomain[]) {
  const [sort, setSort] = useState<SortOption | undefined>(undefined);

  const handleSetSort = useCallback((value: SortOption | undefined) => {
    setSort(value);
  }, []);

  const isSortActive = useMemo(() => Boolean(sort), [sort]);

  const sortedBooks = useMemo(() => {
    if (!sort) return books;
    return [...books].sort((a, b) => {
      if (sort === "pages_asc") return (a.pages ?? 0) - (b.pages ?? 0);
      return (b.pages ?? 0) - (a.pages ?? 0);
    });
  }, [books, sort]);

  return { sort, sortedBooks, isSortActive, handleSetSort };
}
