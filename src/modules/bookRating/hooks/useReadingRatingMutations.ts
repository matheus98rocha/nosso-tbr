import { useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { BookReadingRatingsService } from "../services/bookReadingRatings.service";

const service = new BookReadingRatingsService();

export function useInvalidateBookReadingRatings(userId: string | undefined) {
  const qc = useQueryClient();
  return useCallback(() => {
    if (!userId) return;
    void qc.invalidateQueries({
      predicate: (q) => {
        const k = q.queryKey;
        return k[0] === "bookReadingRatings" && k[1] === userId;
      },
    });
  }, [qc, userId]);
}

export function useSaveReadingRatingMutation(userId: string | undefined) {
  const invalidate = useInvalidateBookReadingRatings(userId);

  const mutation = useMutation({
    mutationFn: async (next: { bookId: string; stars: number }) => {
      await service.upsertRating(next.bookId, next.stars);
    },
    onSuccess: () => {
      invalidate();
    },
  });

  const saveStars = useCallback(
    async (bookId: string, stars: number) => {
      await mutation.mutateAsync({ bookId, stars });
    },
    [mutation],
  );

  return useMemo(
    () => ({
      saveStars,
      isPending: mutation.isPending,
    }),
    [mutation.isPending, saveStars],
  );
}

export function useRemoveReadingRatingMutation(userId: string | undefined) {
  const invalidate = useInvalidateBookReadingRatings(userId);

  const mutation = useMutation({
    mutationFn: async (bookId: string) => {
      await service.removeRating(bookId);
    },
    onSuccess: () => {
      invalidate();
    },
  });

  const remove = useCallback(
    async (bookId: string) => {
      await mutation.mutateAsync(bookId);
    },
    [mutation],
  );

  return useMemo(
    () => ({
      removeRating: remove,
      isPending: mutation.isPending,
    }),
    [mutation.isPending, remove],
  );
}
