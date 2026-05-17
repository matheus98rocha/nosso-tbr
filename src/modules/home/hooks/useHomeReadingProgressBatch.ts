import { useMemo } from "react";
import type { BookDomain } from "@/types/books.types";
import { useReadingProgressMany } from "@/modules/schedule/hooks/useReadingProgressMany";

export function useHomeReadingProgressBatch(books: BookDomain[] | undefined) {
  const readingBookIds = useMemo(() => {
    if (!books || books.length === 0) return [] as string[];
    return books
      .filter(
        (book): book is BookDomain & { id: string } =>
          book.status === "reading" && typeof book.id === "string",
      )
      .map((book) => book.id);
  }, [books]);

  const { progressByBookId, isLoading, isError } =
    useReadingProgressMany(readingBookIds);

  return useMemo(
    () => ({
      readingBookIds,
      progressByBookId,
      isLoading,
      isError,
    }),
    [readingBookIds, progressByBookId, isLoading, isError],
  );
}
