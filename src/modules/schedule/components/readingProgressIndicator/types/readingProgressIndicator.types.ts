import type { ScheduleDomain } from "../../../types/schedule.types";
import type { ReadingProgressDomain } from "../../../types/readingProgress.types";

export type ReadingProgressIndicatorVariant = "card" | "page";

export type ReadingProgressIndicatorProps = {
  progress: ReadingProgressDomain | null;
  variant: ReadingProgressIndicatorVariant;
  className?: string;
  onNavigateToSchedule?: () => void;
};

export type CardReadingProgressIndicatorProps = {
  bookId: string | undefined;
  onNavigateToSchedule: () => void;
  className?: string;
};

export type PageReadingProgressIndicatorProps = {
  bookId: string;
  schedule: readonly ScheduleDomain[] | undefined;
  className?: string;
};
