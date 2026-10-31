"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, ChevronLeft, ChevronRight, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import FinishedReadingRatingDialog from "@/modules/bookRating/components/finishedReadingRatingDialog";
import { cn } from "@/lib/utils";

import ReadingNowBookDetailsModal from "./components/readingNowBookDetailsModal";
import ReadingNowBookSlide from "./components/readingNowBookSlide";
import ReadingNowCarouselDots from "./components/readingNowCarouselDots";
import ReadingNowStatusConfirmationDialog from "./components/readingNowStatusConfirmationDialog";
import { useReadingNow } from "./hooks";
import type { ReadingNowProps, ReadingNowScope } from "./readingNow.types";

const READING_NOW_COPY: Record<
  ReadingNowScope,
  {
    kicker: string;
    title: string;
    description: string;
    ariaLabel: string;
    error: string;
  }
> = {
  solo: {
    kicker: "Lendo agora",
    title: "Sua leitura",
    description: "O livro que só você está lendo.",
    ariaLabel: "Sua leitura. O livro que só você está lendo.",
    error: "Não foi possível carregar a sua leitura.",
  },
  collective: {
    kicker: "Lendo agora",
    title: "Leitura coletiva",
    description: "O livro que vocês estão lendo juntos.",
    ariaLabel: "Leitura coletiva. O livro que vocês estão lendo juntos.",
    error: "Não foi possível carregar as leituras coletivas.",
  },
};

const sectionTransition = {
  duration: 0.35,
  ease: [0.33, 1, 0.68, 1] as const,
};

export default function ReadingNow({
  className,
  scope = "solo",
}: ReadingNowProps) {
  const copy = READING_NOW_COPY[scope];
  const reduceMotion = useReducedMotion();
  const {
    scrollRef,
    items,
    activeIndex,
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
  } = useReadingNow(scope);

  if (!shouldRender && ratingPromptBookId === null) {
    return null;
  }

  return (
    <>
      {shouldRender && detailsBook ? (
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

      {shouldRender ? (
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reduceMotion ? 0 : sectionTransition.duration,
          ease: sectionTransition.ease,
        }}
        className={cn(
          "w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-border bg-card shadow-[0_12px_40px_-28px_oklch(0.25_0.05_264/0.28)]",
          className,
        )}
        aria-label={copy.ariaLabel}
      >
        <div
          className={cn(
            "border-b border-border px-3 py-2.5",
            scope === "collective"
              ? "bg-violet-50/80 dark:bg-violet-950/25"
              : "bg-emerald-50/70 dark:bg-emerald-950/20",
          )}
        >
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="flex min-w-0 items-start gap-2">
              <span
                className={cn(
                  "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md",
                  scope === "collective"
                    ? "bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-200"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
                )}
              >
                {scope === "collective" ? (
                  <Users className="size-3.5" aria-hidden />
                ) : (
                  <BookOpen className="size-3.5" aria-hidden />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  {copy.kicker}
                </p>
                <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
                  <h2 className="brand-display min-w-0 text-sm font-semibold leading-tight tracking-tight text-[var(--reading-ink)]">
                    {copy.title}
                  </h2>
                  {!isLoading && items.length > 0 && (
                    <span className="shrink-0 rounded-full bg-background/80 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                      {items.length}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex min-w-0 shrink-0 items-center gap-0.5">
              {hasMultipleBooks && (
                <>
                  <span className="mr-1 hidden text-[11px] font-medium tabular-nums text-muted-foreground md:inline">
                    {activeIndex + 1}/{items.length}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground sm:size-8"
                    onClick={goToPrevious}
                    disabled={!canGoPrevious}
                    aria-label="Livro anterior"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground sm:size-8"
                    onClick={goToNext}
                    disabled={!canGoNext}
                    aria-label="Próximo livro"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </>
              )}

              {!isLoading && activeScheduleHref && (
                <Link
                  href={activeScheduleHref}
                  className="ml-1 hidden max-w-[9.5rem] truncate rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground md:inline-flex"
                >
                  Registrar progresso
                </Link>
              )}
            </div>
          </div>
          <p className="mt-1.5 pl-9 text-[11px] leading-snug text-muted-foreground">
            {copy.description}
          </p>
        </div>

        {isLoading ? (
          <div className="flex gap-3 px-3 py-3" aria-busy="true">
            <Skeleton className="h-[84px] w-14 shrink-0 rounded-md" />
            <div className="flex flex-1 flex-col justify-center gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          </div>
        ) : isError ? (
          <div className="px-3 py-3 text-center">
            <p className="text-xs text-muted-foreground">{copy.error}</p>
          </div>
        ) : (
          <>
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className={cn(
                "flex w-full min-w-0 overflow-x-auto overscroll-x-contain scroll-smooth",
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
      ) : null}
    </>
  );
}
