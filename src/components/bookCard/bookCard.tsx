"use client";

import Image from "next/image";
import { EllipsisVerticalIcon, Heart, Users } from "lucide-react";

import BookCardDetailsModal from "./components/bookCardDetailsModal";
import { AddBookToShelf } from "./components/addBookToShelf";
import { DropdownBook } from "./components/dropdownBook";
import { BookUpsert } from "@/modules/bookUpsert";
import { ConfirmDialog } from "@/components/confirmDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { useBookCard } from "./hooks/useBookCard";
import { BookCardProps } from "./types/bookCard.types";
import { resolveBookCoverUrl } from "@/constants/bookCover";
import { cn } from "@/lib/utils";
import { formatBookPagesLabel } from "@/utils/formatters";

export function BookCard(props: BookCardProps) {
  const { isShelf = false, hideInteractions = false } = props;
  const {
    book,
    dialogAddShelfModal,
    dialogDeleteModal,
    dialogEditModal,
    dropdownModal,
    bookDetailsModal,
    handleOpenBookDetails,
    handleAuthorSearchFromDetails,
    handleCollectiveReadingFromDetails,
    handleScheduleFromDetails,
    handleQuotesFromDetails,
    dropdownTap,
    shareOnWhatsApp,
    handleNavigateToSchedule,
    handleNavigateToQuotes,
    isLogged,
    handleConfirmDelete,
    statusDisplay,
    isOwnSoloBook,
    showFavoriteToggle,
    handleFavoriteClick,
    isFavoritePending,
    canAccessCollectiveReading,
  } = useBookCard(props);

  const showTopActions =
    showFavoriteToggle || (isLogged && !hideInteractions);
  const showReadersOnCard =
    isLogged && Boolean(book.readersDisplay?.trim());

  const coverSizes = isShelf
    ? { width: 56, height: 92, className: "relative h-[92px] w-14 shrink-0 overflow-hidden rounded-md bg-muted/20 shadow-sm" }
    : { width: 90, height: 130, className: "relative h-[130px] w-[90px] shrink-0 overflow-hidden rounded-md shadow-sm" };

  const pagesLabel = formatBookPagesLabel(book.pages);

  const bookMain = (
    <button
      type="button"
      onClick={handleOpenBookDetails}
      className={cn(
        "flex min-w-0 flex-1 cursor-pointer gap-3 rounded-md border-0 bg-transparent p-0 text-left transition-opacity duration-200 hover:opacity-95 active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-zinc-500 dark:focus-visible:ring-offset-zinc-950",
        isShelf ? "gap-2.5" : "gap-3",
      )}
      aria-label={`Ver detalhes: ${book.title}`}
    >
      <div className={coverSizes.className}>
        <Image
          src={resolveBookCoverUrl(book.image_url)}
          alt=""
          width={coverSizes.width}
          height={coverSizes.height}
          className="size-full object-cover"
          loading="lazy"
        />
      </div>
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          isShelf ? "min-h-[92px] gap-1" : "min-h-[130px] gap-1.5",
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <p
              className={cn(
                "min-w-0 font-semibold leading-snug text-zinc-900 line-clamp-2 dark:text-zinc-100",
                isShelf ? "text-xs" : "text-sm",
              )}
            >
              {book.title}
            </p>
          </TooltipTrigger>
          <TooltipContent sideOffset={4} className="max-w-xs text-pretty">
            {book.title}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <p
              className={cn(
                "min-w-0 text-zinc-600 dark:text-zinc-400",
                isShelf ? "line-clamp-1 text-[11px]" : "line-clamp-2 text-xs leading-snug",
              )}
            >
              {book.author}
            </p>
          </TooltipTrigger>
          <TooltipContent sideOffset={4} className="max-w-xs text-pretty">
            {book.author}
          </TooltipContent>
        </Tooltip>
        {pagesLabel && (
          <p
            className={cn(
              "shrink-0 tabular-nums text-zinc-500 dark:text-zinc-500",
              isShelf ? "text-[10px] leading-tight" : "text-[11px] leading-tight",
            )}
          >
            {pagesLabel}
          </p>
        )}

        {(showReadersOnCard || statusDisplay) && (
          <div
            className={cn(
              "mt-auto flex min-w-0 flex-col",
              isShelf ? "gap-1" : "gap-1.5",
            )}
          >
            {showReadersOnCard && (
              <span className="flex min-w-0 items-center gap-1 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                <Users aria-hidden className="size-2.5 shrink-0" />
                <span className="truncate">{book.readersDisplay}</span>
              </span>
            )}
            {statusDisplay && (
              <span
                className={cn(
                  "inline-flex w-fit items-center gap-1 rounded-full font-semibold",
                  isShelf
                    ? "h-4 gap-0.5 px-1.5 py-0 text-[9px]"
                    : "px-2 py-0.5 text-[10px]",
                  statusDisplay.colorClass,
                )}
              >
                <span
                  className={cn(
                    "shrink-0 rounded-full",
                    isShelf ? "h-1 w-1" : "h-1.5 w-1.5",
                    statusDisplay.dotClass,
                  )}
                />
                {statusDisplay.label}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );

  return (
    <>
      <BookCardDetailsModal
        open={bookDetailsModal.isOpen}
        onOpenChange={bookDetailsModal.setIsOpen}
        book={book}
        statusDisplay={statusDisplay}
        isLogged={isLogged}
        isOwnSoloBook={isOwnSoloBook}
        canAccessCollectiveReading={canAccessCollectiveReading}
        scheduleDisabled={book.status === "finished"}
        quotesDisabled={book.status === "not_started"}
        onAuthorSearch={handleAuthorSearchFromDetails}
        onCollectiveReading={handleCollectiveReadingFromDetails}
        onOpenSchedule={handleScheduleFromDetails}
        onOpenQuotes={handleQuotesFromDetails}
      />

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
          <div
            className={cn("flex min-w-0", isShelf ? "gap-2.5" : "gap-3")}
          >
            {bookMain}
            {showTopActions && (
              <div
                className={cn(
                  "flex shrink-0 flex-col items-end gap-0.5",
                  isShelf ? "pt-px" : "pt-px",
                )}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
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
                      "flex cursor-pointer items-center justify-center rounded-full border transition-colors duration-200 disabled:opacity-60",
                      isShelf ? "h-7 w-7" : "h-9 w-9",
                      book.is_favorite
                        ? "border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-950/60"
                        : "border-zinc-200 bg-zinc-50/80 text-zinc-400 hover:border-rose-200 hover:text-rose-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400 dark:hover:border-rose-800 dark:hover:text-rose-400",
                    )}
                  >
                    <Heart
                      className={cn(
                        isShelf ? "h-3 w-3" : "h-4 w-4",
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
                          "flex shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 hover:bg-zinc-100 active:opacity-70 dark:hover:bg-zinc-800",
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
        </CardContent>
      </Card>
    </>
  );
}
