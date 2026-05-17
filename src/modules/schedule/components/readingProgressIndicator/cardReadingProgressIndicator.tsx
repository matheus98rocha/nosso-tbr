"use client";

import { CalendarPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { useBookCardScheduleProgress } from "../../hooks/useBookCardScheduleProgress";
import { ReadingProgressIndicator } from "./readingProgressIndicator";
import type { CardReadingProgressIndicatorProps } from "./types/readingProgressIndicator.types";

function CardReadingProgressIndicator({
  bookId,
  onNavigateToSchedule,
  className,
}: CardReadingProgressIndicatorProps) {
  const { progress, isLoading, isError, showNoScheduleCta } =
    useBookCardScheduleProgress(bookId);

  if (!bookId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={cn("w-full", className)} aria-busy="true">
        <Skeleton className="h-2.5 w-full rounded-full" />
      </div>
    );
  }

  if (isError) {
    return null;
  }

  if (showNoScheduleCta) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          "h-8 w-full cursor-pointer gap-1.5 border-emerald-200/80 bg-emerald-50/50 text-emerald-800 hover:bg-emerald-100/80 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-200 dark:hover:bg-emerald-950/50",
          className,
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onNavigateToSchedule();
        }}
      >
        <CalendarPlus className="size-3.5 shrink-0" aria-hidden />
        Criar cronograma
      </Button>
    );
  }

  return (
    <div className={cn("flex w-full flex-col items-center", className)}>
      <ReadingProgressIndicator
        progress={progress}
        variant="card"
        onNavigateToSchedule={onNavigateToSchedule}
      />
    </div>
  );
}

export default CardReadingProgressIndicator;
