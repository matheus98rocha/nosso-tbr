"use client";

import Image from "next/image";
import { BookOpen, EllipsisVerticalIcon, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownBook } from "./components/dropdownBook";
import { BookUpsert } from "@/modules/bookUpsert";
import { ConfirmDialog } from "@/components/confirmDialog";
import { AddBookToShelf } from "./components/addBookToShelf";
import { useBookCard } from "./hooks/useBookCard";
import { BookCardProps } from "./types/bookCard.types";
import { getGenderLabel, getGenreBadgeColor } from "@/constants/genders";
import { cn } from "@/lib/utils";
import { resolveBookCoverUrl } from "@/constants/bookCover";

export function BookCard(props: BookCardProps) {
  const { isShelf = false } = props;
  const {
    book,
    dialogAddShelfModal,
    dialogDeleteModal,
    dialogEditModal,
    dropdownModal,
    dropdownTap,
    shareOnWhatsApp,
    handleNavigateToSchedule,
    handleNavigateToAuthor,
    isLogged,
    handleNavigateToQuotes,
    handleConfirmDelete,
    statusDisplay,
  } = useBookCard(props);

  const bookBody = (
    <>
      <div className="mb-0.5 flex items-start justify-between gap-1">
        <p
          className={cn(
            "font-semibold leading-snug line-clamp-2 text-zinc-900 dark:text-zinc-100",
            isShelf ? "text-xs" : "text-sm",
          )}
        >
          {book.title}
        </p>

        {isLogged && (
          <DropdownBook
            isOpen={dropdownModal.isOpen}
            onOpenChange={dropdownModal.setIsOpen}
            trigger={
              <button
                type="button"
                aria-label={`Mais opções para "${book.title}"`}
                className={cn(
                  "flex items-center justify-center shrink-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 rounded-full transition-all duration-200 cursor-pointer",
                  isShelf ? "w-8 h-8 -mr-1" : "w-11 h-11 -mr-2",
                )}
              >
                <EllipsisVerticalIcon
                  className={cn(
                    "text-zinc-400",
                    isShelf ? "w-3.5 h-3.5" : "w-4 h-4",
                  )}
                  aria-hidden
                  onTouchStart={dropdownTap.handleTouchStart}
                  onTouchEnd={dropdownTap.handleTouchEnd}
                  onClick={dropdownTap.handleClick}
                />
              </button>
            }
            editBook={() => dialogEditModal.setIsOpen(true)}
            removeBook={() => dialogDeleteModal.setIsOpen(true)}
            addToShelf={() => dialogAddShelfModal.setIsOpen(true)}
            shareOnWhatsApp={shareOnWhatsApp}
            schedule={handleNavigateToSchedule}
            quotes={handleNavigateToQuotes}
            isFinishedReading={book.status === "finished"}
            quotesDisabled={book.status !== "not_started"}
          />
        )}
      </div>

      <button
        type="button"
        onClick={handleNavigateToAuthor}
        aria-label={`Autor: ${book.author} — ${book.title}`}
        className={cn(
          "text-blue-600 dark:text-blue-400 hover:underline active:scale-95 truncate text-left cursor-pointer transition-all duration-200",
          isShelf ? "text-[11px] mb-1" : "text-xs mb-2",
        )}
      >
        {book.author}
      </button>

      <div
        className={cn("flex flex-col mt-auto", isShelf ? "gap-1" : "gap-1.5")}
      >
        {statusDisplay && (
          <span
            className={cn(
              "inline-flex w-fit items-center gap-1 rounded-full font-semibold",
              isShelf
                ? "h-4 gap-0.5 px-1.5 text-[9px] py-0"
                : "px-2 py-0.5 text-[10px]",
              statusDisplay.colorClass,
            )}
          >
            <span
              className={cn(
                "shrink-0 rounded-full",
                isShelf ? "h-1 w-1" : "w-1.5 h-1.5",
                statusDisplay.dotClass,
              )}
            />
            {statusDisplay.label}
          </span>
        )}
        {isShelf === false && (
          <div className="flex items-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-500">
            {book.readersDisplay && (
              <span className="flex items-center gap-1 shrink-0">
                <Users size={10} className="shrink-0" />
                <span>{book.readersDisplay}</span>
              </span>
            )}
            {book.readersDisplay && book.pages && (
              <span className="text-zinc-300 dark:text-zinc-600 select-none">
                ·
              </span>
            )}
            {book.pages && (
              <span className="flex items-center gap-1 shrink-0">
                <BookOpen size={10} className="shrink-0" />
                <span>{book.pages} páginas</span>
              </span>
            )}
          </div>
        )}

        {isShelf === true && (
          <div className="flex items-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-500">
            {book.readersDisplay && book.pages && (
              <span className="text-zinc-300 dark:text-zinc-600 select-none">
                ·
              </span>
            )}
            {book.pages && (
              <span className="flex items-center gap-1 shrink-0">
                <BookOpen size={10} className="shrink-0" />
                <span>{book.pages} páginas</span>
              </span>
            )}
          </div>
        )}

        {book.is_reread && (
          <Badge
            variant="secondary"
            className={cn(
              "w-fit border-none font-medium uppercase",
              isShelf
                ? "h-4 px-1.5 text-[9px] py-0"
                : "h-5 px-2 text-[10px] py-0",
              "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
            )}
          >
            Releitura
          </Badge>
        )}

        {book.gender && (
          <Badge
            variant="secondary"
            className={cn(
              "w-fit border-none font-medium uppercase",
              isShelf
                ? "h-4 px-1.5 text-[9px] py-0"
                : "h-5 px-2 text-[10px] py-0",
              getGenreBadgeColor(book.gender),
            )}
          >
            {getGenderLabel(book.gender)}
          </Badge>
        )}
      </div>
    </>
  );

  return (
    <>
      <AddBookToShelf
        isOpen={dialogAddShelfModal.isOpen}
        handleClose={dialogAddShelfModal.setIsOpen}
        bookId={book.id ?? ""}
      />

      <ConfirmDialog
        title="Excluir livro"
        buttonLabel={!isShelf ? "Deletar" : "Remover"}
        description={
          !isShelf ? "Deseja excluir este livro?" : "Remover da estante?"
        }
        id={String(book.id)}
        queryKeyToInvalidate="books"
        onConfirm={handleConfirmDelete}
        open={dialogDeleteModal.isOpen}
        onOpenChange={dialogDeleteModal.setIsOpen}
      />

      <BookUpsert
        isBookFormOpen={dialogEditModal.isOpen}
        setIsBookFormOpen={dialogEditModal.setIsOpen}
        bookData={book}
      />

      <Card
        className={cn(
          "group overflow-hidden",
          isShelf
            ? "h-full border-0 bg-transparent shadow-none transition-colors duration-200"
            : "border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-shadow duration-200",
        )}
      >
        <CardContent className={cn(isShelf ? "p-2" : "p-3")}>
          {isShelf ? (
            <div className="flex gap-2.5">
              <div className="relative h-[92px] w-14 shrink-0 overflow-hidden rounded-md bg-muted/20 shadow-sm">
                <Image
                  src={resolveBookCoverUrl(book.image_url)}
                  alt={book.title}
                  width={56}
                  height={92}
                  className="object-cover size-full"
                  loading="lazy"
                />
              </div>
              <div className="flex min-h-[92px] min-w-0 flex-1 flex-col">
                {bookBody}
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <div className="relative shrink-0 w-[90px] h-[130px] rounded-md overflow-hidden shadow-sm">
                <Image
                  src={resolveBookCoverUrl(book.image_url)}
                  alt={book.title}
                  width={90}
                  height={130}
                  className="object-cover size-full"
                  loading="lazy"
                />
              </div>

              <div className="flex flex-col flex-1 min-w-0">{bookBody}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
