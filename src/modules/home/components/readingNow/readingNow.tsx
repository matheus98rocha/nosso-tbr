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
import ReadingNowStatusConfirmationDialog from "./components/readingNowStatusConfirmationDialog";
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
    abandonReading,
    pendingStatusTransition,
    requestStatusTransition,
    cancelStatusTransition,
    confirmStatusTransition,
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
          onFinishReading={() => requestStatusTransition(detailsBook, "finished")}
          onPauseReading={() => requestStatusTransition(detailsBook, "paused")}
          onAbandonReading={() => abandonReading(detailsBook)}
          isStatusPending={isStatusPending}
        />
      ) : null}

      <FinishedReadingRatingDialog
        bookId={ratingPromptBookId}
        open={ratingPromptBookId !== null}
        onDismiss={dismissRatingPrompt}
      />

      <ReadingNowStatusConfirmationDialog
        target={pendingStatusTransition}
        open={pendingStatusTransition !== null}
        isPending={isStatusPending}
        onOpenChange={(open) => {
          if (!open) cancelStatusTransition();
        }}
        onConfirm={confirmStatusTransition}
      />

      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reduceMotion ? 0 : sectionTransition.duration,
          ease: sectionTransition.ease,
        }}
        className={cn(
          "overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-none",
          "dark:border-zinc-800 dark:bg-zinc-900/70",
          className,
        )}
        aria-label="Lendo agora"
      >
        <div className="flex flex-col gap-1.5 border-b border-zinc-200/70 px-3 py-2.5 dark:border-zinc-800/80">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                <BookOpen size={13} aria-hidden className="text-zinc-400 dark:text-zinc-500" />
                Lendo agora
              </p>
              {!isLoading && items.length > 0 && (
                <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
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
                  className="ml-1 rounded-md px-2 py-1 text-[10px] font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
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
          <div className="px-3 py-3 text-center">
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
                  onFinishReading={() => requestStatusTransition(item.book, "finished")}
                  onPauseReading={() => requestStatusTransition(item.book, "paused")}
                  onAbandonReading={() => requestStatusTransition(item.book, "abandoned")}
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
