import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/keys";
import { useUserStore } from "@/stores/userStore";

import type { BookDomain } from "@/types/books.types";
import { BookReadingRatingsService } from "../services/bookReadingRatings.service";

const service = new BookReadingRatingsService();

export function useReadingRatingsBatchFromBooks(books: BookDomain[] | undefined) {
  const userId = useUserStore((s) => s.user?.id);

  const finishedBookIds = useMemo(() => {
    if (!books?.length) return [];
    return books
      .filter(
        (b): b is BookDomain & { id: string } =>
          b.status === "finished" && typeof b.id === "string" && !!b.id,
      )
      .map((b) => b.id);
  }, [books]);

  const sortedIds = useMemo(
    () => [...finishedBookIds].sort(),
    [finishedBookIds],
  );

  const query = useQuery({
    queryKey:
      userId && sortedIds.length > 0
        ? QUERY_KEYS.bookReadingRatings.batch(userId, sortedIds)
        : (["bookReadingRatings", "disabled"] as const),
    queryFn: () => service.listStarsByBookIds(sortedIds),
    enabled: Boolean(userId && sortedIds.length > 0),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: false,
  });

  const starsByBookId = query.data ?? new Map<string, number>();

  return useMemo(
    () => ({
      finishedBookIds,
      sortedIds,
      starsByBookId,
      isLoading: query.isLoading,
      isError: query.isError,
    }),
    [finishedBookIds, sortedIds, starsByBookId, query.isLoading, query.isError],
  );
}
