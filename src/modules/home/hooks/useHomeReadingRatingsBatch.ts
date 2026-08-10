import { useMemo } from "react";

import type { BookDomain } from "@/types/books.types";
import { useReadingRatingsBatchFromBooks } from "@/modules/bookRating/hooks/useReadingRatingsBatchFromBooks";

export function useHomeReadingRatingsBatch(books: BookDomain[] | undefined) {
  return useReadingRatingsBatchFromBooks(books);
}
