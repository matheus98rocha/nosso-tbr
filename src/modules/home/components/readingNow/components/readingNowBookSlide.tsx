"use client";

import { CalendarDays, CalendarPlus, MessageSquareQuote } from "lucide-react";

import { BookCover } from "@/components/bookCover";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import ReadingNowStatusActions from "./readingNowStatusActions";
import type { ReadingNowBookSlideProps } from "../readingNow.types";

const readingProgressTrackClassName = cn(
  "rounded-full bg-emerald-950/[0.08] shadow-inner shadow-emerald-950/[0.06] ring-1 ring-inset ring-emerald-950/[0.08]",
  "dark:bg-emerald-400/[0.12] dark:shadow-emerald-950/20 dark:ring-emerald-400/20",
);

const readingProgressIndicatorClassName = cn(
  "bg-linear-to-r from-emerald-500 via-teal-500 to-emerald-600",
  "shadow-[0_0_10px_-2px_rgba(16,185,129,0.5)] dark:shadow-[0_0_14px_-2px_rgba(52,211,153,0.35)]",
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
}: ReadingNowBookSlideProps) {
  const { book, scheduleProgress, daysReading } = item;
  const hasSchedule = scheduleProgress !== null;

  return (
    <article className="flex min-w-full shrink-0 snap-start snap-always flex-col gap-3 px-4 py-3 sm:flex-row sm:items-stretch">
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <div className="flex min-w-0 gap-3">
          <button
            type="button"
            onClick={onOpenDetails}
            className="flex min-w-0 flex-1 cursor-pointer gap-3 rounded-lg border-0 bg-transparent p-0 text-left transition-opacity duration-200 hover:opacity-95 active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label={`Ver detalhes: ${book.title}`}
          >
            <BookCover
              src={book.image_url}
              alt=""
              width={44}
              height={66}
              containerClassName="shrink-0 rounded-md shadow-sm ring-1 ring-zinc-200/80 dark:ring-zinc-700/80"
              priority
            />

            <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
              <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {book.title}
              </h3>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {book.author}
              </p>
            </div>
          </button>
        </div>

        <div className="space-y-1.5">
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
                className={cn("h-2 min-h-2 w-full", readingProgressTrackClassName)}
                indicatorClassName={readingProgressIndicatorClassName}
              />
              <div className="flex items-center justify-between gap-2 text-[10px] text-zinc-500 dark:text-zinc-400">
                <span className="tabular-nums">
                  Cronograma: {scheduleProgress.completed}/{scheduleProgress.total} dias
                </span>
                <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                  {scheduleProgress.percentage}%
                </span>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 w-full max-w-xs gap-1.5 border-emerald-200/80 bg-emerald-50/50 text-[10px] text-emerald-800 hover:bg-emerald-100/80 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-200 dark:hover:bg-emerald-950/50"
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

      <div className="flex shrink-0 flex-row gap-1.5 sm:flex-col sm:justify-center sm:py-0.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 min-h-8 flex-1 gap-1 px-2.5 text-[11px] sm:min-w-[6.5rem] sm:flex-none"
          onClick={onNavigateToSchedule}
        >
          <CalendarDays size={12} aria-hidden />
          Cronograma
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 min-h-8 flex-1 gap-1 px-2.5 text-[11px] text-zinc-500 sm:min-w-[6.5rem] sm:flex-none"
          onClick={onNavigateToQuotes}
        >
          <MessageSquareQuote size={12} aria-hidden />
          Citações
        </Button>
      </div>
    </article>
  );
}
