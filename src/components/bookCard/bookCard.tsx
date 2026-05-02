"use client";

import Image from "next/image";
import { BookOpen, EllipsisVerticalIcon, Heart, Lock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  const { isShelf = false, hideInteractions = false } = props;
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
    isOwnSoloBook,
    showFavoriteToggle,
    handleFavoriteClick,
    isFavoritePending,
  } = useBookCard(props);

  const showTopActions =
    showFavoriteToggle || (isLogged && !hideInteractions);

  const bookBody = (
    <>
      <div
        className={cn(
          "flex min-w-0 gap-2",
          showTopActions ? "items-start" : "items-stretch",
          isShelf ? "mb-0.5" : "mb-1",
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <p
              className={cn(
                "min-w-0 flex-1 cursor-default font-semibold leading-snug line-clamp-2 text-left text-zinc-900 dark:text-zinc-100",
                isShelf ? "text-xs pr-1" : "text-sm pr-1",
              )}
            >
              {book.title}
            </p>
          </TooltipTrigger>
          <TooltipContent sideOffset={4} className="max-w-xs text-pretty">
            {book.title}
          </TooltipContent>
        </Tooltip>
        {showTopActions && (
          <div className="flex shrink-0 items-center gap-0.5 pt-px">
            {showFavoriteToggle && (
              <button
                type="button"
                onClick={handleFavoriteClick}
                disabled={isFavoritePending}
                title={
                  book.is_favorite
                    ? "Remover dos favoritos (também no menu ⋮)"
                    : "Marcar como favorito (também no menu ⋮)"
                }
                aria-label={
                  book.is_favorite
                    ? `Remover "${book.title}" dos favoritos`
                    : `Marcar "${book.title}" como favorito`
                }
                aria-pressed={book.is_favorite}
                className={cn(
                  "flex items-center justify-center rounded-full border transition-colors duration-200 cursor-pointer disabled:opacity-60",
                  isShelf ? "w-7 h-7" : "w-9 h-9",
                  book.is_favorite
                    ? "border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-950/60"
                    : "border-zinc-200 bg-zinc-50/80 text-zinc-400 hover:border-rose-200 hover:text-rose-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400 dark:hover:border-rose-800 dark:hover:text-rose-400",
                )}
              >
                <Heart
                  className={cn(
                    isShelf ? "w-3 h-3" : "w-4 h-4",
                    book.is_favorite && "fill-current",
                  )}
                  aria-hidden
                />
              </button>
            )}
            {isLogged && !hideInteractions && (
              <DropdownBook
                isOpen={dropdownModal.isOpen}
                onOpenChange={dropdownModal.setIsOpen}
                onToggleFavorite={() => handleFavoriteClick()}
                isFavorite={book.is_favorite}
                favoriteActionBusy={isFavoritePending}
                trigger={
                  <button
                    type="button"
                    aria-label={`Mais opções para "${book.title}"`}
                    className={cn(
                      "flex shrink-0 items-center justify-center rounded-full transition-colors duration-200 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 active:opacity-70",
                      isShelf ? "h-8 w-8" : "h-11 w-11",
                    )}
                  >
                    <EllipsisVerticalIcon
                      className={cn(
                        "text-zinc-400",
                        isShelf ? "size-3.5" : "size-4",
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
                removeBookLabel={
                  isShelf ? "Remover livro da estante" : "Remover livro"
                }
                addToShelf={() => dialogAddShelfModal.setIsOpen(true)}
                shareOnWhatsApp={shareOnWhatsApp}
                schedule={handleNavigateToSchedule}
                quotes={handleNavigateToQuotes}
                isFinishedReading={book.status === "finished"}
                quotesDisabled={book.status !== "not_started"}
              />
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleNavigateToAuthor}
        aria-label={`Autor: ${book.author} — ${book.title}`}
        className={cn(
          "text-blue-600 dark:text-blue-400 truncate text-left cursor-pointer underline-offset-2 transition-colors duration-200 hover:underline active:opacity-70",
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
            {book.readersDisplay && (
              <span className="flex shrink-0 items-center gap-1">
                <Users size={10} className="shrink-0" />
                <span>{book.readersDisplay}</span>
              </span>
            )}
            {book.readersDisplay && book.pages && (
              <span className="select-none text-zinc-300 dark:text-zinc-600">
                ·
              </span>
            )}
            {book.pages && (
              <span className="flex shrink-0 items-center gap-1">
                <BookOpen size={10} className="shrink-0" />
                <span>{book.pages} páginas</span>
              </span>
            )}
          </div>
        )}

        {isOwnSoloBook && (
          <Badge
            variant="secondary"
            aria-label="Livro privado — visível apenas para você"
            className={cn(
              "w-fit border-none font-medium uppercase",
              isShelf
                ? "h-4 px-1.5 text-[9px] py-0 gap-0.5"
                : "h-5 px-2 text-[10px] py-0 gap-1",
              "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
            )}
          >
            <Lock
              aria-hidden
              className={cn(isShelf ? "w-2 h-2" : "w-2.5 h-2.5")}
            />
            Privado
          </Badge>
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
        title={isShelf ? "Remover livro da estante" : "Excluir livro"}
        buttonLabel={isShelf ? "Remover da estante" : "Deletar"}
        description={
          isShelf
            ? `O livro "${book.title}" será retirado somente desta estante. Ele continua na sua biblioteca e não é excluído permanentemente.`
            : "Deseja excluir este livro?"
        }
        id={String(book.id)}
        queryKeyToInvalidate={isShelf ? "bookshelf-books" : "books"}
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
          "group gap-0 overflow-hidden py-0",
          isShelf
            ? "h-full border-0 bg-transparent shadow-none transition-colors duration-200"
            : "border-zinc-200 bg-zinc-50/30 dark:border-zinc-800 dark:bg-zinc-900/40 transition-shadow duration-200 hover:shadow-md",
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

              <div className="flex min-h-[130px] min-w-0 flex-1 flex-col">
                {bookBody}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
