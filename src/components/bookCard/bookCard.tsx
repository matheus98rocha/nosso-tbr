"use client";

import { EllipsisVerticalIcon, Heart, Users } from "lucide-react";

import { BookCover } from "@/components/bookCover";

import BookCardDetailsModal from "./components/bookCardDetailsModal";
import { CardAddToLibraryButton } from "./components/cardAddToLibraryButton";
import { CardStartReadingButton } from "./components/cardStartReadingButton";
import { AddBookToShelf } from "./components/addBookToShelf";
import { DropdownBook } from "./components/dropdownBook";
import { CardReadingProgressIndicator } from "@/modules/schedule/components/readingProgressIndicator";
import { CardReadingRatingButton } from "@/modules/bookRating";
import { ConfirmDialog } from "@/components/confirmDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useBookCard } from "./hooks/useBookCard";
import { BookCardProps } from "./types/bookCard.types";
import { cn } from "@/lib/utils";
import { formatBookPagesLabel } from "@/utils/formatters";

export function BookCard(props: BookCardProps) {
  const { isShelf = false, onEditBook } = props;
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
    onStartReading: handleStartReading,
    onFinishReading: handleFinishReading,
    onPauseReading: handlePauseReading,
    onAbandonReading: handleAbandonReading,
    isStatusPending,
    dropdownTap,
    shareOnWhatsApp,
    handleNavigateToSchedule,
    handleNavigateToQuotes,
    isLogged,
    handleConfirmDelete,
    statusDisplay,
    isOwnSoloBook,
    showFavoriteToggle,
    showBookOptionsMenu,
    handleFavoriteClick,
    isFavoritePending,
    canAccessCollectiveReading,
    showReadingProgress,
    showCardFooterAction,
    cardReadingActionLabel,
    showAddToLibrary,
    addToLibrary,
    isAddToLibraryPending,
  } = useBookCard(props);

  const showTopActions = showFavoriteToggle || showBookOptionsMenu;
  const showReadersOnCard = isLogged && Boolean(book.readersDisplay?.trim());
  const cardStatusDisplay =
    statusDisplay && book.status === "finished"
      ? { ...statusDisplay, label: "Leitura finalizada" }
      : statusDisplay;

  const coverSizes = isShelf
    ? {
        width: 56,
        height: 92,
        className:
          "relative h-[92px] w-14 shrink-0 overflow-hidden rounded-md bg-muted/20 shadow-sm",
      }
    : {
        width: 90,
        height: 130,
        className:
          "relative h-[130px] w-[90px] shrink-0 overflow-hidden rounded-md shadow-sm",
      };

  const pagesLabel = formatBookPagesLabel(book.pages);

  const bookMain = (
    <button
      type="button"
      onClick={handleOpenBookDetails}
      className={cn(
        "flex min-w-0 flex-1 cursor-pointer gap-3 rounded-md border-0 bg-transparent p-0 text-left transition-opacity duration-200 hover:opacity-95 active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isShelf ? "gap-2.5 text-left" : "gap-3 text-center",
      )}
      aria-label={`Ver detalhes: ${book.title}`}
    >
      <BookCover
        src={book.image_url}
        alt=""
        width={coverSizes.width}
        height={coverSizes.height}
        containerClassName={coverSizes.className}
      />
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          isShelf ? "min-h-[92px] gap-1" : "min-h-[130px] gap-1.5",
          !isShelf && "items-center text-center",
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <p
              className={cn(
                "min-w-0 shrink-0 font-semibold text-foreground line-clamp-2",
                isShelf ? "min-h-8 text-xs leading-4" : "min-h-10 text-sm leading-5",
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
                "min-w-0 text-muted-foreground",
                isShelf
                  ? "line-clamp-1 text-[11px]"
                  : "line-clamp-2 text-xs leading-snug",
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
              "shrink-0 tabular-nums text-muted-foreground/80",
              isShelf
                ? "text-[10px] leading-tight"
                : "text-[11px] leading-tight",
            )}
          >
            {pagesLabel}
          </p>
        )}

        {(showReadersOnCard || cardStatusDisplay) && (
          <div
            className={cn(
              "flex min-w-0 flex-col",
              isShelf ? "gap-1" : "gap-1.5",
              !isShelf && "items-center",
              !(showCardFooterAction && !isShelf) && "mt-auto",
              showCardFooterAction && !isShelf && "mt-1",
            )}
          >
            {showReadersOnCard && (
              <span
                className={cn(
                  "flex max-w-full min-w-0 items-center justify-center gap-1 text-[11px] leading-relaxed text-muted-foreground",
                )}
              >
                <Users aria-hidden className="size-2.5 shrink-0" />
                <Badge variant="outline" className="min-w-0 max-w-full font-normal">
                  <span className="truncate">{book.readersDisplay}</span>
                </Badge>
              </span>
            )}
            {cardStatusDisplay && (
              <Badge
                variant="secondary"
                className={cn(
                  "mx-auto inline-flex w-fit items-center gap-1 rounded-full font-semibold",
                  isShelf
                    ? "h-4 gap-0.5 px-1.5 py-0 text-[9px]"
                    : "px-2 py-0.5 text-[10px]",
                )}
              >
                <span
                  className={cn(
                    "shrink-0 rounded-full",
                    isShelf ? "h-1 w-1" : "h-1.5 w-1.5",
                    cardStatusDisplay.dotClass,
                  )}
                />
                {cardStatusDisplay.label}
              </Badge>
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
        onStartReading={handleStartReading}
        onFinishReading={handleFinishReading}
        onPauseReading={handlePauseReading}
        onAbandonReading={handleAbandonReading}
        isStatusPending={isStatusPending}
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

      <Card
        className={cn(
          "group gap-0 overflow-hidden py-0",
          isShelf
            ? "h-full border-0 bg-transparent shadow-none transition-colors duration-200"
            : "border-border/70 bg-card/80 shadow-sm transition-shadow duration-200 hover:shadow-md",
        )}
      >
        <CardContent
          className={cn(
            isShelf ? "p-2" : "p-3",
            showCardFooterAction && !isShelf && "pb-3 pt-3",
          )}
        >
          <div
            className={cn(
              "flex min-w-0 flex-col",
              (showCardFooterAction && !isShelf) ||
                (!isShelf && book.status === "finished")
                ? "gap-2.5"
                : "gap-0",
            )}
          >
            <div className={cn("flex min-w-0", isShelf ? "gap-2.5" : "gap-3")}>
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
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
                        "rounded-full border border-transparent transition-colors duration-200",
                        isShelf ? "size-7" : "size-9",
                        book.is_favorite
                          ? "border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/15"
                          : "text-muted-foreground hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive",
                      )}
                    >
                      <Heart
                        className={cn(
                          isShelf ? "h-3 w-3" : "h-4 w-4",
                          book.is_favorite && "fill-current",
                        )}
                        aria-hidden
                      />
                    </Button>
                  )}
                  {showBookOptionsMenu && (
                    <DropdownBook
                      isOpen={dropdownModal.isOpen}
                      onOpenChange={dropdownModal.setIsOpen}
                      onToggleFavorite={() => handleFavoriteClick()}
                      isFavorite={book.is_favorite}
                      favoriteActionBusy={isFavoritePending}
                      trigger={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Mais opções para "${book.title}"`}
                          className={cn(
                            "shrink-0 rounded-full text-muted-foreground active:opacity-70",
                            isShelf ? "size-8" : "size-11",
                          )}
                        >
                          <EllipsisVerticalIcon
                            className={cn(
                              "text-muted-foreground",
                              isShelf ? "size-3.5" : "size-4",
                            )}
                            aria-hidden
                            onTouchStart={dropdownTap.handleTouchStart}
                            onTouchEnd={dropdownTap.handleTouchEnd}
                            onClick={dropdownTap.handleClick}
                          />
                        </Button>
                      }
                      editBook={() =>
                        onEditBook
                          ? onEditBook()
                          : dialogEditModal.setIsOpen(true)
                      }
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
            {showCardFooterAction && !isShelf && (
              <CardFooter className="flex min-w-0 w-full flex-col items-center gap-2 border-t border-border/70 px-0 pt-2.5">
                {showAddToLibrary ? (
                  <CardAddToLibraryButton
                    bookTitle={book.title}
                    onAddToLibrary={addToLibrary}
                    isPending={isAddToLibraryPending}
                  />
                ) : showReadingProgress ? (
                  <CardReadingProgressIndicator
                    bookId={book.id}
                    onNavigateToSchedule={handleNavigateToSchedule}
                  />
                ) : (
                  <CardStartReadingButton
                    bookTitle={book.title}
                    onStartReading={handleStartReading}
                    isPending={isStatusPending}
                    label={cardReadingActionLabel}
                  />
                )}
              </CardFooter>
            )}
            {!isShelf && book.status === "finished" && (
              <CardFooter className="flex min-w-0 w-full flex-col items-center gap-2 border-t border-border/70 px-0 pt-2.5">
                <CardReadingRatingButton book={book} />
              </CardFooter>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
