"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BookMarked } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import NextReadingBookDetailsModal from "./components/nextReadingBookDetailsModal";
import NextReadingCard from "./components/nextReadingCard";
import NextReadingStartConfirmationDialog from "./components/nextReadingStartConfirmationDialog";
import { useNextReading } from "./hooks";
import type { NextReadingProps } from "./nextReading.types";

const sectionTransition = {
  duration: 0.35,
  ease: [0.33, 1, 0.68, 1] as const,
};

export default function NextReading({ className, onEditBook }: NextReadingProps) {
  const reduceMotion = useReducedMotion();
  const {
    item,
    shouldRender,
    isLoading,
    isError,
    detailsBook,
    detailsModalOpen,
    openBookDetails,
    handleDetailsOpenChange,
    pendingStartBook,
    requestStartReading,
    cancelStartReading,
    confirmStartReading,
    isStatusPending,
  } = useNextReading();

  if (!shouldRender) {
    return null;
  }

  return (
    <>
      {detailsBook ? (
        <NextReadingBookDetailsModal
          book={detailsBook}
          open={detailsModalOpen}
          onOpenChange={handleDetailsOpenChange}
          onStartReading={() => requestStartReading(detailsBook)}
          isStatusPending={isStatusPending}
        />
      ) : null}

      <NextReadingStartConfirmationDialog
        bookTitle={pendingStartBook?.title ?? null}
        open={pendingStartBook !== null}
        isPending={isStatusPending}
        onOpenChange={(open) => {
          if (!open) cancelStartReading();
        }}
        onConfirm={confirmStartReading}
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
        aria-label="Próxima leitura"
      >
        <div className="flex items-center justify-between gap-3 border-b border-zinc-200/70 px-3 py-2.5 dark:border-zinc-800/80">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
            <BookMarked
              size={13}
              aria-hidden
              className="text-zinc-400 dark:text-zinc-500"
            />
            Próxima leitura
          </p>
        </div>

        {isLoading ? (
          <div className="flex gap-3 px-4 py-3" aria-busy="true">
            <Skeleton className="h-[57px] w-[38px] shrink-0 rounded-md" />
            <div className="flex flex-1 flex-col justify-center gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-8 w-full max-w-xs rounded-md" />
            </div>
          </div>
        ) : isError ? (
          <div className="px-3 py-3 text-center">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Não foi possível carregar sua próxima leitura.
            </p>
          </div>
        ) : item ? (
          <NextReadingCard
            item={item}
            onOpenDetails={() => openBookDetails(item.book)}
            onRequestStartReading={() => requestStartReading(item.book)}
            isStatusPending={isStatusPending}
            onEditBook={onEditBook ? () => onEditBook(item.book) : undefined}
          />
        ) : null}
      </motion.section>
    </>
  );
}
