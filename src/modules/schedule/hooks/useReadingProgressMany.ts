import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { useUserStore } from "@/stores/userStore";

import { ReadingProgressService } from "../services/readingProgress.service";
import type {
  ReadingProgressByBookId,
  ReadingProgressDomain,
  ReadingProgressPersistence,
} from "../types/readingProgress.types";
import type { SchedulePaceByBookId } from "../types/schedulePace.types";
import { computeReadingProgress } from "../utils/computeReadingProgress";
import { computeSchedulePaceFromAggregates } from "../utils/computeSchedulePace";
import {
  normalizeReadingProgressManyQueryData,
  type ReadingProgressManyQueryData,
} from "../utils/normalizeReadingProgressManyQueryData";
import { getReadingProgressManyQueryKey } from "../utils/readingProgressQueryKey";

const service = new ReadingProgressService();

const STALE_TIME = 1000 * 60 * 5;
const GC_TIME = 1000 * 60 * 10;

export type { ReadingProgressManyQueryData };

function toQueryData(
  rows: readonly ReadingProgressPersistence[],
): ReadingProgressManyQueryData {
  const progress: ReadingProgressDomain[] = [];
  const paceByBookId: SchedulePaceByBookId = new Map();

  for (const row of rows) {
    const domain = computeReadingProgress(row.book_id, row.total, row.completed);
    if (!domain) {
      continue;
    }

    progress.push(domain);

    const pace = computeSchedulePaceFromAggregates({
      overdue: row.overdue,
      ahead: row.ahead,
      lastDate: row.last_date,
    });

    if (pace) {
      paceByBookId.set(row.book_id, pace);
    }
  }

  return { progress, paceByBookId };
}

function toDomainMap(
  rows: readonly ReadingProgressDomain[],
): ReadingProgressByBookId {
  const map = new Map<string, ReadingProgressDomain>();
  for (const row of rows) {
    map.set(row.bookId, row);
  }
  return map;
}

export function useReadingProgressMany(bookIds: readonly string[]) {
  const isLoggedIn = useIsLoggedIn();
  const userId = useUserStore((state) => state.user?.id);

  const sortedBookIds = useMemo(() => [...bookIds].sort(), [bookIds]);

  const queryKey = useMemo(
    () => getReadingProgressManyQueryKey(sortedBookIds, userId),
    [sortedBookIds, userId],
  );

  const enabled = isLoggedIn && !!userId && sortedBookIds.length > 0;

  const { data, isLoading, isError } = useQuery<ReadingProgressManyQueryData>({
    queryKey,
    queryFn: async () => {
      const persistence = await service.getMany(sortedBookIds);
      return toQueryData(persistence);
    },
    enabled,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnMount: false,
  });

  const normalized = useMemo(
    () => normalizeReadingProgressManyQueryData(data),
    [data],
  );

  const progressByBookId = useMemo<ReadingProgressByBookId>(
    () => toDomainMap(normalized.progress),
    [normalized],
  );

  const paceByBookId = normalized.paceByBookId;

  return useMemo(
    () => ({
      progressByBookId,
      paceByBookId,
      isLoading: enabled && isLoading,
      isError,
    }),
    [progressByBookId, paceByBookId, enabled, isLoading, isError],
  );
}
