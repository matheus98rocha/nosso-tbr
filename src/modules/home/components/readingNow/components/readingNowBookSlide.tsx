"use client";

import { CalendarDays, CalendarPlus, MessageSquareQuote } from "lucide-react";

import { BookCover } from "@/components/bookCover";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import {
  READING_NOW_COVER_SIZE,
  type ReadingNowBookSlideProps,
} from "../readingNow.types";
import {
  formatReadingNowDaysLabel,
  formatReadingNowEmptyScheduleLabel,
} from "../utils/formatReadingNowMeta";
import ReadingNowStatusActions from "./readingNowStatusActions";

const readingProgressTrackClassName = cn(
  "rounded-full bg-emerald-950/[0.08] ring-1 ring-inset ring-emerald-950/10",
  "dark:bg-emerald-400/10 dark:ring-emerald-400/20",
);

const readingProgressIndicatorClassName = "bg-emerald-600 dark:bg-emerald-400";

const toolButtonClassName =
  "h-8 min-h-8 min-w-0 w-full shrink gap-1.5 overflow-hidden px-2 text-[11px] md:w-auto md:px-2.5";

export default function ReadingNowBookSlide({
  item,
  onOpenDetails,
  onNavigateToSchedule,
  onNavigateToQuotes,
  onFinishReading,
  onPauseReading,
  onAbandonReading,
  isProgressLoading,
  isStatusPending,
}: ReadingNowBookSlideProps) {
  const { book, scheduleProgress, daysReading } = item;
  const hasSchedule = scheduleProgress !== null;
  const daysLabel = formatReadingNowDaysLabel(daysReading);
  const emptyScheduleLabel = formatReadingNowEmptyScheduleLabel(book.pages);

  return (
    <article className="flex w-full min-w-0 shrink-0 basis-full snap-start snap-always flex-col gap-3 px-3 py-3">
      <button
        type="button"
        onClick={onOpenDetails}
        className="flex w-full min-w-0 cursor-pointer gap-3 rounded-lg border-0 bg-transparent p-0 text-left transition-opacity duration-200 hover:opacity-95 active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={`Ver detalhes: ${book.title}`}
      >
        <BookCover
          src={book.image_url}
          alt=""
          width={READING_NOW_COVER_SIZE.width}
          height={READING_NOW_COVER_SIZE.height}
          containerClassName="shrink-0 rounded-md shadow-[0_8px_20px_-12px_oklch(0.25_0.05_264/0.45)] ring-1 ring-border"
          priority
        />

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-0.5">
          <h3 className="brand-display truncate text-[15px] font-semibold leading-snug text-foreground">
            {book.title}
          </h3>
          <p className="truncate text-xs text-muted-foreground">{book.author}</p>
          {daysLabel ? (
            <p className="text-[11px] tabular-nums text-muted-foreground">{daysLabel}</p>
          ) : null}
        </div>
      </button>

      <div className="min-w-0">
        {isProgressLoading ? (
          <Skeleton className="h-2 w-full rounded-full" aria-busy="true" />
        ) : hasSchedule ? (
          <div className="space-y-1.5">
            <Progress
              value={scheduleProgress.percentage}
              aria-label={`${scheduleProgress.completed} de ${scheduleProgress.total} dias lidos (${scheduleProgress.percentage}%)`}
              aria-valuenow={scheduleProgress.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              className={cn("h-1.5 min-h-1.5 w-full", readingProgressTrackClassName)}
              indicatorClassName={readingProgressIndicatorClassName}
            />
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
              <span className="min-w-0 tabular-nums">
                Cronograma: {scheduleProgress.completed}/{scheduleProgress.total}{" "}
                dias
              </span>
              <span className="font-medium tabular-nums text-emerald-700 dark:text-emerald-300">
                {scheduleProgress.percentage}%
              </span>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground">{emptyScheduleLabel}</p>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-2 border-t border-border pt-2.5 md:flex-row md:items-center md:justify-between md:gap-3">
        <ReadingNowStatusActions
          className="min-w-0 w-full md:flex-1"
          isPending={isStatusPending}
          onFinish={onFinishReading}
          onPause={onPauseReading}
          onAbandon={onAbandonReading}
        />

        <div
          className={cn(
            "grid w-full min-w-0 gap-1.5 md:flex md:w-auto",
            hasSchedule ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2",
          )}
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={toolButtonClassName}
            onClick={onNavigateToSchedule}
          >
            {hasSchedule ? (
              <CalendarDays className="size-3.5" aria-hidden />
            ) : (
              <CalendarPlus className="size-3.5" aria-hidden />
            )}
            {hasSchedule ? "Cronograma" : "Criar cronograma"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(toolButtonClassName, "text-muted-foreground")}
            onClick={onNavigateToQuotes}
          >
            <MessageSquareQuote className="size-3.5" aria-hidden />
            Citações
          </Button>
        </div>
      </div>
    </article>
  );
}
