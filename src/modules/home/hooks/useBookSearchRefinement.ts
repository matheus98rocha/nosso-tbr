import { useCallback, useMemo } from "react";
import { levenshteinDistance } from "@/utils/levenshteinDistance";
import { normalizeForBookTitleSearch } from "@/utils/normalizeForBookTitleSearch";
import type {
  UseBookSearchRefinementParams,
  UseBookSearchRefinementResult,
} from "./useBookSearchRefinement.types";

export function useBookSearchRefinement({
  books,
  searchTerm,
  isEnabled,
}: UseBookSearchRefinementParams): UseBookSearchRefinementResult {
  const normalizedSearchText = useMemo(
    () => normalizeForBookTitleSearch(searchTerm),
    [searchTerm],
  );

  const titleDistanceToQuery = useCallback(
    (title: string) => {
      const normalizedTitle = normalizeForBookTitleSearch(title);
      return levenshteinDistance(normalizedSearchText, normalizedTitle);
    },
    [normalizedSearchText],
  );

  const refinedBooks = useMemo(() => {
    if (!isEnabled || normalizedSearchText.length === 0) {
      return books;
    }

    const indexedBooks = books.map((book, originalIndex) => ({
      book,
      originalIndex,
    }));

    indexedBooks.sort((left, right) => {
      const distanceLeft = titleDistanceToQuery(left.book.title);
      const distanceRight = titleDistanceToQuery(right.book.title);
      if (distanceLeft !== distanceRight) {
        return distanceLeft - distanceRight;
      }
      return left.originalIndex - right.originalIndex;
    });

    return indexedBooks.map((item) => item.book);
  }, [books, isEnabled, normalizedSearchText, titleDistanceToQuery]);

  return useMemo(
    () => ({ refinedBooks }),
    [refinedBooks],
  );
}
