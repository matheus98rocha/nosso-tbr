"use client";

import { CalendarDays, CalendarPlus, MessageSquareQuote } from "lucide-react";

import BookOptionsMenu from "@/components/bookCard/components/bookOptionsMenu";
import { BookCover } from "@/components/bookCover";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import ReadingNowStatusActions from "./readingNowStatusActions";
import type { ReadingNowBookSlideProps } from "../readingNow.types";

const readingProgressTrackClassName = cn(
  "rounded-full bg-zinc-100 ring-1 ring-inset ring-zinc-200/70",
  "dark:bg-zinc-800 dark:ring-zinc-700",
);

const readingProgressIndicatorClassName = cn(
  "bg-emerald-500 dark:bg-emerald-400",
);

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
  onEditBook,
}: ReadingNowBookSlideProps) {
  const { book, scheduleProgress, daysReading } = item;
  const hasSchedule = scheduleProgress !== null;

  return (
    <article className="flex min-w-full shrink-0 snap-start snap-always flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex min-w-0 items-start gap-1">
          <button
            type="button"
            onClick={onOpenDetails}
            className="flex min-w-0 flex-1 cursor-pointer gap-2.5 rounded-lg border-0 bg-transparent p-0 text-left transition-opacity duration-200 hover:opacity-95 active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label={`Ver detalhes: ${book.title}`}
          >
            <BookCover
              src={book.image_url}
              alt=""
              width={38}
              height={57}
              containerClassName="shrink-0 rounded-md ring-1 ring-zinc-200/80 dark:ring-zinc-700/80"
              priority
            />

            <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
              <h3 className="truncate text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
                {book.title}
              </h3>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {book.author}
              </p>
            </div>
          </button>

          <BookOptionsMenu book={book} onEditBook={onEditBook} />
        </div>

        <div className="space-y-1">
          {isProgressLoading ? (
            <Skeleton className="h-2 w-full rounded-full" aria-busy="true" />
          ) : hasSchedule ? (
            <div className="space-y-1">
              <Progress
                value={scheduleProgress.percentage}
                aria-label={`${scheduleProgress.completed} de ${scheduleProgress.total} dias lidos (${scheduleProgress.percentage}%)`}
                aria-valuenow={scheduleProgress.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                className={cn("h-1.5 min-h-1.5 w-full", readingProgressTrackClassName)}
                indicatorClassName={readingProgressIndicatorClassName}
              />
              <div className="flex items-center justify-between gap-2 text-[10px] text-zinc-400 dark:text-zinc-500">
                <span className="tabular-nums">
                  Cronograma: {scheduleProgress.completed}/{scheduleProgress.total} dias
                </span>
                <span className="font-medium tabular-nums text-emerald-700 dark:text-emerald-300">
                  {scheduleProgress.percentage}%
                </span>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 w-full max-w-xs gap-1.5 border-zinc-200 bg-zinc-50 text-[10px] text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-300 dark:hover:bg-zinc-800"
              onClick={onNavigateToSchedule}
            >
              <CalendarPlus size={12} aria-hidden />
              Criar cronograma
            </Button>
          )}

          {daysReading !== null && (
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
              {daysReading === 1 ? "1º dia de leitura" : `${daysReading} dias lendo`}
            </p>
          )}
        </div>

        <ReadingNowStatusActions
          isPending={isStatusPending}
          onFinish={onFinishReading}
          onPause={onPauseReading}
          onAbandon={onAbandonReading}
        />
      </div>

      <div className="flex shrink-0 flex-row gap-1 sm:flex-col sm:justify-center sm:py-0.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 min-h-7 flex-1 gap-1 px-2 text-[10px] sm:min-w-[5.75rem] sm:flex-none"
          onClick={onNavigateToSchedule}
        >
          <CalendarDays size={12} aria-hidden />
          Cronograma
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 min-h-7 flex-1 gap-1 px-2 text-[10px] text-zinc-500 sm:min-w-[5.75rem] sm:flex-none"
          onClick={onNavigateToQuotes}
        >
          <MessageSquareQuote size={12} aria-hidden />
          Citações
        </Button>
      </div>
    </article>
  );
}
