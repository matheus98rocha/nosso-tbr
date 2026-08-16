import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { useUserStore } from "@/stores/userStore";

import type { ReadingProgressDomain } from "../types/readingProgress.types";
import {
  normalizeReadingProgressManyQueryData,
  type ReadingProgressManyQueryData,
} from "../utils/normalizeReadingProgressManyQueryData";

export function useReadingProgress(bookId: string | undefined) {
  const queryClient = useQueryClient();
  const userId = useUserStore((state) => state.user?.id);

  const progress = useMemo<ReadingProgressDomain | null>(() => {
    if (!bookId || !userId) {
      return null;
    }

    const caches = queryClient.getQueriesData<
      ReadingProgressManyQueryData | ReadingProgressDomain[]
    >({
      predicate: (query) => {
        const key = query.queryKey;
        return (
          Array.isArray(key) &&
          key[0] === "schedule" &&
          key[1] === "progress" &&
          key[2] === "many" &&
          key[4] === userId
        );
      },
    });

    for (const [, data] of caches) {
      const found = normalizeReadingProgressManyQueryData(data).progress.find(
        (row) => row.bookId === bookId,
      );
      if (found) return found;
    }

    return null;
  }, [queryClient, bookId, userId]);

  return useMemo(() => ({ progress }), [progress]);
}
