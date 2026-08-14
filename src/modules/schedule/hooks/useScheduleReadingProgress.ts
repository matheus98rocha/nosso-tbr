import { useMemo } from "react";
import type { ScheduleDomain } from "../types/schedule.types";
import { computeReadingProgressFromSchedule } from "../utils/computeReadingProgress";

export function useScheduleReadingProgress(
  bookId: string,
  schedule: readonly ScheduleDomain[] | undefined,
) {
  const progress = useMemo(
    () => computeReadingProgressFromSchedule(bookId, schedule),
    [bookId, schedule],
  );

  return useMemo(() => ({ progress }), [progress]);
}
