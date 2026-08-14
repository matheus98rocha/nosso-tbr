"use client";

import { useScheduleReadingProgress } from "../../hooks/useScheduleReadingProgress";
import { ReadingProgressIndicator } from "./readingProgressIndicator";
import type { PageReadingProgressIndicatorProps } from "./types/readingProgressIndicator.types";

export function PageReadingProgressIndicator({
  bookId,
  schedule,
  className,
}: PageReadingProgressIndicatorProps) {
  const { progress } = useScheduleReadingProgress(bookId, schedule);

  return (
    <ReadingProgressIndicator
      progress={progress}
      variant="page"
      className={className}
    />
  );
}

export default PageReadingProgressIndicator;
