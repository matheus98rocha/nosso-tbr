"use client";

import { cn } from "@/lib/utils";

import { useScheduleReadingPace } from "../../hooks/useScheduleReadingPace";
import { useScheduleReadingProgress } from "../../hooks/useScheduleReadingProgress";
import { SchedulePaceLabel } from "../schedulePaceLabel";
import { ReadingProgressIndicator } from "./readingProgressIndicator";
import type { PageReadingProgressIndicatorProps } from "./types/readingProgressIndicator.types";

export function PageReadingProgressIndicator({
  bookId,
  schedule,
  className,
}: PageReadingProgressIndicatorProps) {
  const { progress } = useScheduleReadingProgress(bookId, schedule);
  const { pace } = useScheduleReadingPace(schedule);

  return (
    <div className={cn("flex w-full flex-col gap-2.5", className)}>
      <ReadingProgressIndicator progress={progress} variant="page" />
      <SchedulePaceLabel pace={pace} variant="page" />
    </div>
  );
}

export default PageReadingProgressIndicator;
