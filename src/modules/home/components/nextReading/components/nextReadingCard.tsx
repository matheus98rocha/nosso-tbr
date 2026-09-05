"use client";

import { Play } from "lucide-react";

import BookOptionsMenu from "@/components/bookCard/components/bookOptionsMenu";
import { BookCover } from "@/components/bookCover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { NextReadingCardProps } from "../nextReading.types";

function badgeClassName(isStartOverdue: boolean, isToday: boolean): string {
  if (isStartOverdue) {
    return "bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300";
  }

  if (isToday) {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300";
  }

  return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";
}

export default function NextReadingCard({
  item,
  onOpenDetails,
  onRequestStartReading,
  isStatusPending,
  onEditBook,
}: NextReadingCardProps) {
  const { book, dateMeta } = item;
  const startAriaLabel = dateMeta.formattedStartDate
    ? `Início previsto ${dateMeta.formattedStartDate}${
        dateMeta.relativeLabel ? `, ${dateMeta.relativeLabel.toLowerCase()}` : ""
      }`
    : "Data de início prevista indisponível";

  return (
    <article className="flex flex-col gap-2.5 px-3 py-2.5">
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

      <div className="flex flex-wrap items-center gap-1.5">
        {dateMeta.formattedStartDate ? (
          <p className="text-[10px] tabular-nums text-zinc-400 dark:text-zinc-500">
            Início: {dateMeta.formattedStartDate}
          </p>
        ) : null}
        {dateMeta.relativeLabel ? (
          <span
            role="status"
            aria-label={startAriaLabel}
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
              badgeClassName(dateMeta.isStartOverdue, dateMeta.isToday),
            )}
          >
            {dateMeta.relativeLabel}
          </span>
        ) : null}
      </div>

      {typeof book.pages === "number" && book.pages > 0 ? (
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
          {book.pages} páginas
        </p>
      ) : null}

      <Button
        type="button"
        size="sm"
        className={cn(
          "h-8 w-full max-w-xs gap-1.5 cursor-pointer text-[11px] font-medium",
          "bg-zinc-900 text-zinc-50 hover:bg-zinc-800",
          "dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200",
          "transition-colors duration-200",
        )}
        disabled={isStatusPending}
        aria-busy={isStatusPending}
        aria-label={`Iniciar leitura de ${book.title}`}
        onClick={onRequestStartReading}
      >
        <Play size={13} aria-hidden />
        Iniciar leitura
      </Button>
    </article>
  );
}
