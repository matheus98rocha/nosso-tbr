import { useContext, useMemo } from "react";

import { ScheduleProgressBatchContext } from "../context/scheduleProgressBatchContext";
import type { SchedulePaceDomain } from "../types/schedulePace.types";
import { useReadingProgressMany } from "./useReadingProgressMany";

export function useBookCardScheduleProgress(bookId: string | undefined) {
  const batch = useContext(ScheduleProgressBatchContext);

  const fallbackIds = useMemo(() => {
    if (batch !== undefined || !bookId) {
      return [] as string[];
    }
    return [bookId];
  }, [batch, bookId]);

  const fallback = useReadingProgressMany(fallbackIds);

  return useMemo(() => {
    const progressByBookId =
      batch !== undefined ? batch.progressByBookId : fallback.progressByBookId;
    const paceByBookId =
      batch !== undefined ? batch.paceByBookId : fallback.paceByBookId;
    const isLoading =
      batch !== undefined ? batch.isLoading : fallback.isLoading;
    const isError = batch !== undefined ? batch.isError : fallback.isError;

    const progress =
      bookId !== undefined && bookId !== ""
        ? (progressByBookId.get(bookId) ?? null)
        : null;

    const pace: SchedulePaceDomain | null =
      bookId !== undefined && bookId !== ""
        ? (paceByBookId.get(bookId) ?? null)
        : null;

    return {
      progress,
      pace,
      isLoading,
      isError,
      showNoScheduleCta:
        !!bookId && !isLoading && !isError && progress === null,
    };
  }, [
    batch,
    bookId,
    fallback.isError,
    fallback.isLoading,
    fallback.paceByBookId,
    fallback.progressByBookId,
  ]);
}
