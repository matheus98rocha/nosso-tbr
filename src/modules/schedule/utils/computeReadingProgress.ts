import type { ReadingProgressDomain } from "../types/readingProgress.types";

export function computeReadingProgress(
  bookId: string,
  total: number,
  completed: number,
): ReadingProgressDomain | null {
  if (!Number.isFinite(total) || total <= 0) {
    return null;
  }

  const safeCompleted = Math.max(
    0,
    Math.min(Number.isFinite(completed) ? completed : 0, total),
  );

  const percentage = Math.round((safeCompleted / total) * 100);

  return {
    bookId,
    total,
    completed: safeCompleted,
    percentage,
  };
}

export function computeReadingProgressFromSchedule<
  T extends { completed: boolean },
>(bookId: string, schedule: readonly T[] | undefined | null): ReadingProgressDomain | null {
  if (!schedule || schedule.length === 0) {
    return null;
  }

  const total = schedule.length;
  const completed = schedule.reduce(
    (acc, row) => (row.completed ? acc + 1 : acc),
    0,
  );

  return computeReadingProgress(bookId, total, completed);
}
