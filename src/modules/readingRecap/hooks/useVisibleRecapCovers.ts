import { useCallback, useEffect, useMemo, useState } from "react";

import { BOOK_COVER_PLACEHOLDER_SRC } from "@/constants/bookCover";

import type { RecapImageCover, UseVisibleRecapCoversResult } from "../types";

export function useVisibleRecapCovers(
  covers: RecapImageCover[],
): UseVisibleRecapCoversResult {
  const [failedBookIds, setFailedBookIds] = useState<string[]>([]);
  const coverKey = covers.map((cover) => `${cover.bookId}:${cover.src}`).join("\0");

  useEffect(() => {
    setFailedBookIds([]);
  }, [coverKey]);

  const visibleCovers = useMemo(() => {
    const failed = new Set(failedBookIds);
    return covers.map((cover) => ({
      ...cover,
      src: failed.has(cover.bookId)
        ? BOOK_COVER_PLACEHOLDER_SRC
        : cover.src,
    }));
  }, [covers, failedBookIds]);

  const handleCoverError = useCallback((bookId: string) => {
    setFailedBookIds((current) =>
      current.includes(bookId) ? current : [...current, bookId],
    );
  }, []);

  return {
    visibleCovers,
    handleCoverError,
  };
}

export default useVisibleRecapCovers;
