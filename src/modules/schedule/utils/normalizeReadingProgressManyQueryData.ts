import type { ReadingProgressDomain } from "../types/readingProgress.types";
import type { SchedulePaceByBookId } from "../types/schedulePace.types";

export type ReadingProgressManyQueryData = {
  progress: ReadingProgressDomain[];
  paceByBookId: SchedulePaceByBookId;
};

export function normalizeReadingProgressManyQueryData(
  data: ReadingProgressManyQueryData | ReadingProgressDomain[] | undefined,
): ReadingProgressManyQueryData {
  if (!data) {
    return { progress: [], paceByBookId: new Map() };
  }

  if (Array.isArray(data)) {
    return { progress: data, paceByBookId: new Map() };
  }

  return {
    progress: Array.isArray(data.progress) ? data.progress : [],
    paceByBookId:
      data.paceByBookId instanceof Map ? data.paceByBookId : new Map(),
  };
}
