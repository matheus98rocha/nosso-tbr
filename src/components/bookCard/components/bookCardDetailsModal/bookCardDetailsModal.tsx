"use client";

import Image from "next/image";
import {
  BookMarked,
  CalendarDays,
  Heart,
  Lock,
  MessageSquareQuote,
  Users,
} from "lucide-react";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getGenderLabel, getGenreBadgeColor } from "@/constants/genders";
import { resolveBookCoverUrl } from "@/constants/bookCover";
import { cn } from "@/lib/utils";
import { formatBookPagesLabel } from "@/utils/formatters";

import type { BookCardDetailsModalProps } from "./types/bookCardDetailsModal.types";

function formatPtDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function BookCardDetailsModal({
  open,
  onOpenChange,
  book,
  statusDisplay,
  isLogged,
  isOwnSoloBook,
  canAccessCollectiveReading,
  scheduleDisabled,
  quotesDisabled,
  onAuthorSearch,
  onCollectiveReading,
  onOpenSchedule,
  onOpenQuotes,
}: BookCardDetailsModalProps) {
  const plannedLabel = useMemo(
    () => formatPtDate(book.planned_start_date),
    [book.planned_start_date],
  );
  const startLabel = useMemo(() => formatPtDate(book.start_date), [book.start_date]);
  const endLabel = useMemo(() => formatPtDate(book.end_date), [book.end_date]);

  const showReaders = isLogged && Boolean(book.readersDisplay?.trim());

  const pagesLabel = formatBookPagesLabel(book.pages);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="max-h-[min(85vh,calc(100dvh-2rem))] gap-0 overflow-y-auto p-0 sm:max-w-lg"
      >
        <div className="flex flex-col gap-4 p-6 pt-8">
          <DialogHeader className="gap-2 text-left">
            <DialogTitle className="text-balance pr-8 text-base leading-snug sm:text-lg">
              {book.title}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="flex flex-col gap-0.5 text-left">
                <span className="text-balance text-zinc-600 dark:text-zinc-400">
                  {book.author}
                </span>
                {pagesLabel ? (
                  <span className="text-sm tabular-nums text-zinc-500 dark:text-zinc-500">
                    {pagesLabel}
                  </span>
                ) : null}
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="relative mx-auto shrink-0 overflow-hidden rounded-md shadow-sm sm:mx-0">
              <Image
                src={resolveBookCoverUrl(book.image_url)}
                alt={book.title}
                width={120}
                height={173}
                className="object-cover"
                loading="lazy"
              />
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-3">
              {statusDisplay && (
                <span
                  className={cn(
                    "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                    statusDisplay.colorClass,
                  )}
                >
                  <span
                    className={cn("h-1.5 w-1.5 shrink-0 rounded-full", statusDisplay.dotClass)}
                  />
                  {statusDisplay.label}
                </span>
              )}

              <div className="flex flex-wrap gap-2">
                {isOwnSoloBook && (
                  <Badge
                    variant="secondary"
                    aria-label="Livro privado — visível apenas para você"
                    className="w-fit gap-1 border-none bg-zinc-100 font-medium uppercase text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  >
                    <Lock aria-hidden className="size-2.5" />
                    Privado
                  </Badge>
                )}
                {book.is_favorite && (
                  <Badge
                    variant="secondary"
                    className="w-fit gap-1 border-none bg-rose-100 font-medium uppercase text-rose-700 dark:bg-rose-950/50 dark:text-rose-400"
                  >
                    <Heart aria-hidden className="size-2.5 fill-current" />
                    Favorito
                  </Badge>
                )}
                {book.is_reread && (
                  <Badge
                    variant="secondary"
                    className="w-fit border-none bg-violet-100 font-medium uppercase text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                  >
                    Releitura
                  </Badge>
                )}
                {book.gender && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "w-fit border-none font-medium uppercase",
                      getGenreBadgeColor(book.gender),
                    )}
                  >
                    {getGenderLabel(book.gender)}
                  </Badge>
                )}
              </div>

              <dl className="grid gap-2.5 text-sm">
                <div className="grid grid-cols-[minmax(0,7rem)_1fr] gap-x-3 gap-y-1">
                  <dt className="text-zinc-500 dark:text-zinc-400">Páginas</dt>
                  <dd className="font-medium text-zinc-900 dark:text-zinc-100">{book.pages}</dd>
                </div>
                {plannedLabel && (
                  <div className="grid grid-cols-[minmax(0,7rem)_1fr] gap-x-3 gap-y-1">
                    <dt className="text-zinc-500 dark:text-zinc-400">Início planejado</dt>
                    <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                      {plannedLabel}
                    </dd>
                  </div>
                )}
                {startLabel && (
                  <div className="grid grid-cols-[minmax(0,7rem)_1fr] gap-x-3 gap-y-1">
                    <dt className="text-zinc-500 dark:text-zinc-400">Leitura iniciada</dt>
                    <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                      {startLabel}
                    </dd>
                  </div>
                )}
                {endLabel && (
                  <div className="grid grid-cols-[minmax(0,7rem)_1fr] gap-x-3 gap-y-1">
                    <dt className="text-zinc-500 dark:text-zinc-400">Concluído em</dt>
                    <dd className="font-medium text-zinc-900 dark:text-zinc-100">{endLabel}</dd>
                  </div>
                )}
                {showReaders && (
                  <div className="grid grid-cols-[minmax(0,7rem)_1fr] gap-x-3 gap-y-1">
                    <dt className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                      <Users aria-hidden className="size-3.5 shrink-0" />
                      Leitores
                    </dt>
                    <dd className="min-w-0 font-medium wrap-break-word text-zinc-900 dark:text-zinc-100">
                      {book.readersDisplay}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full cursor-pointer transition-colors duration-200 sm:w-auto"
                  onClick={onAuthorSearch}
                >
                  Buscar por autor
                </Button>
                {isLogged && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={scheduleDisabled}
                      title={
                        scheduleDisabled
                          ? "Cronograma indisponível para livros finalizados"
                          : undefined
                      }
                      className="w-full cursor-pointer gap-1.5 transition-colors duration-200 sm:w-auto"
                      onClick={onOpenSchedule}
                    >
                      <CalendarDays aria-hidden className="size-3.5" />
                      Cronograma
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={quotesDisabled}
                      title={
                        quotesDisabled
                          ? "Citações ficam disponíveis após iniciar a leitura"
                          : undefined
                      }
                      className="w-full cursor-pointer gap-1.5 transition-colors duration-200 sm:w-auto"
                      onClick={onOpenQuotes}
                    >
                      <MessageSquareQuote aria-hidden className="size-3.5" />
                      Citações
                    </Button>
                  </>
                )}
                {canAccessCollectiveReading && (
                  <Button
                    type="button"
                    size="sm"
                    className="w-full cursor-pointer gap-1.5 bg-violet-600 text-white transition-colors duration-200 hover:bg-violet-700 sm:w-auto"
                    onClick={onCollectiveReading}
                  >
                    <BookMarked aria-hidden className="size-3.5" />
                    Leitura coletiva
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
