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
import { computeReadingProgress } from "../utils/computeReadingProgress";
import { getReadingProgressManyQueryKey } from "../utils/readingProgressQueryKey";

const service = new ReadingProgressService();

const STALE_TIME = 1000 * 60 * 5;
const GC_TIME = 1000 * 60 * 10;

function toDomainList(
  rows: readonly ReadingProgressPersistence[],
): ReadingProgressDomain[] {
  const domains: ReadingProgressDomain[] = [];
  for (const row of rows) {
    const domain = computeReadingProgress(row.book_id, row.total, row.completed);
    if (domain) {
      domains.push(domain);
    }
  }
  return domains;
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

  const sortedBookIds = useMemo(
    () => [...bookIds].sort(),
    [bookIds],
  );

  const queryKey = useMemo(
    () => getReadingProgressManyQueryKey(sortedBookIds, userId),
    [sortedBookIds, userId],
  );

  const enabled = isLoggedIn && !!userId && sortedBookIds.length > 0;

  const { data, isLoading, isError } = useQuery<ReadingProgressDomain[]>({
    queryKey,
    queryFn: async () => {
      const persistence = await service.getMany(sortedBookIds);
      return toDomainList(persistence);
    },
    enabled,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnMount: false,
  });

  const progressByBookId = useMemo<ReadingProgressByBookId>(
    () => (Array.isArray(data) ? toDomainMap(data) : new Map()),
    [data],
  );

  return useMemo(
    () => ({
      progressByBookId,
      isLoading: enabled && isLoading,
      isError,
    }),
    [progressByBookId, enabled, isLoading, isError],
  );
}
