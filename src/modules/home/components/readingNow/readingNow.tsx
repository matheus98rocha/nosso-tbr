"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import FinishedReadingRatingDialog from "@/modules/bookRating/components/finishedReadingRatingDialog";
import { cn } from "@/lib/utils";

import ReadingNowBookDetailsModal from "./components/readingNowBookDetailsModal";
import ReadingNowBookSlide from "./components/readingNowBookSlide";
import ReadingNowCarouselDots from "./components/readingNowCarouselDots";
import { useReadingNow } from "./hooks";
import type { ReadingNowProps } from "./readingNow.types";

const sectionTransition = {
  duration: 0.35,
  ease: [0.33, 1, 0.68, 1] as const,
};

export default function ReadingNow({ className }: ReadingNowProps) {
  const reduceMotion = useReducedMotion();
  const {
    scrollRef,
    items,
    activeIndex,
    activeBookTitle,
    hasMultipleBooks,
    shouldRender,
    isLoading,
    isError,
    isProgressLoading,
    goToIndex,
    goToNext,
    goToPrevious,
    handleScroll,
    navigateToSchedule,
    navigateToQuotes,
    activeScheduleHref,
    canGoPrevious,
    canGoNext,
    detailsBook,
    detailsModalOpen,
    openBookDetails,
    handleDetailsOpenChange,
    finishReading,
    pauseReading,
    abandonReading,
    isStatusPending,
    transitioningBookId,
    ratingPromptBookId,
    dismissRatingPrompt,
  } = useReadingNow();

  if (!shouldRender) {
    return null;
  }

  return (
    <>
      {detailsBook ? (
        <ReadingNowBookDetailsModal
          book={detailsBook}
          open={detailsModalOpen}
          onOpenChange={handleDetailsOpenChange}
        />
      ) : null}

      <FinishedReadingRatingDialog
        bookId={ratingPromptBookId}
        open={ratingPromptBookId !== null}
        onDismiss={dismissRatingPrompt}
      />

      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reduceMotion ? 0 : sectionTransition.duration,
          ease: sectionTransition.ease,
        }}
        className={cn(
          "overflow-hidden rounded-2xl border border-zinc-200 bg-linear-to-br from-amber-50/50 via-white to-emerald-50/40 shadow-sm",
          "dark:border-zinc-800 dark:from-amber-950/25 dark:via-zinc-900/50 dark:to-emerald-950/20",
          className,
        )}
        aria-label="Lendo agora"
      >
        <div className="flex flex-col gap-2 border-b border-zinc-200/80 px-4 py-3 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                <BookOpen size={11} aria-hidden className="text-amber-600 dark:text-amber-400" />
                Lendo agora
              </p>
              {!isLoading && items.length > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                  {items.length}
                </span>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {hasMultipleBooks && (
                <>
                  <span className="mr-1 hidden text-[10px] font-medium tabular-nums text-zinc-400 sm:inline">
                    {activeIndex + 1}/{items.length}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-zinc-500"
                    onClick={goToPrevious}
                    disabled={!canGoPrevious}
                    aria-label="Livro anterior"
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-zinc-500"
                    onClick={goToNext}
                    disabled={!canGoNext}
                    aria-label="Próximo livro"
                  >
                    <ChevronRight size={16} />
                  </Button>
                </>
              )}

              {!isLoading && activeScheduleHref && (
                <Link
                  href={activeScheduleHref}
                  className="ml-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold text-white transition-colors hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                >
                  Registrar progresso
                </Link>
              )}
            </div>
          </div>

          {!isLoading && hasMultipleBooks && activeBookTitle && (
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {activeBookTitle}
              </span>
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="flex gap-3 px-4 py-3" aria-busy="true">
            <Skeleton className="h-[66px] w-11 shrink-0 rounded-md" />
            <div className="flex flex-1 flex-col justify-center gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          </div>
        ) : isError ? (
          <div className="px-4 py-4 text-center">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Não foi possível carregar seus livros em leitura.
            </p>
          </div>
        ) : (
          <>
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className={cn(
                "flex overflow-x-auto overscroll-x-contain scroll-smooth",
                hasMultipleBooks
                  ? "snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  : "overflow-x-hidden",
              )}
            >
              {items.map((item) => (
                <ReadingNowBookSlide
                  key={item.book.id}
                  item={item}
                  isProgressLoading={isProgressLoading}
                  isStatusPending={
                    isStatusPending && transitioningBookId === item.book.id
                  }
                  onOpenDetails={() => openBookDetails(item.book)}
                  onNavigateToSchedule={() =>
                    navigateToSchedule(item.book.id, item.book.title)
                  }
                  onNavigateToQuotes={() =>
                    navigateToQuotes(item.book.id, item.book.title)
                  }
                  onFinishReading={() => finishReading(item.book)}
                  onPauseReading={() => pauseReading(item.book)}
                  onAbandonReading={() => abandonReading(item.book)}
                />
              ))}
            </div>

            {hasMultipleBooks && (
              <ReadingNowCarouselDots
                total={items.length}
                activeIndex={activeIndex}
                onSelect={goToIndex}
              />
            )}
          </>
        )}
      </motion.section>
    </>
  );
}
