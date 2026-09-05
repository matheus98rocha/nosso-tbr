"use client";

import { EllipsisVerticalIcon } from "lucide-react";

import { ConfirmDialog } from "@/components/confirmDialog";
import { BookUpsert } from "@/modules/bookUpsert";
import { cn } from "@/lib/utils";

import { AddBookToShelf } from "../addBookToShelf";
import { DropdownBook } from "../dropdownBook";
import { useBookCard } from "../../hooks/useBookCard";
import type { BookOptionsMenuProps } from "./bookOptionsMenu.types";

export default function BookOptionsMenu({
  book,
  onEditBook,
  className,
  triggerClassName,
  iconClassName,
}: BookOptionsMenuProps) {
  const {
    dialogAddShelfModal,
    dialogDeleteModal,
    dialogEditModal,
    dropdownModal,
    dropdownTap,
    shareOnWhatsApp,
    handleNavigateToSchedule,
    handleNavigateToQuotes,
    isLogged,
    handleConfirmDelete,
    handleFavoriteClick,
    isFavoritePending,
    showFavoriteToggle,
  } = useBookCard({ book, isShelf: false });

  if (!isLogged) {
    return null;
  }

  const handleEdit = () => {
    if (onEditBook) {
      onEditBook();
      return;
    }
    dialogEditModal.setIsOpen(true);
  };

  return (
    <>
      {!onEditBook ? (
        <BookUpsert
          isBookFormOpen={dialogEditModal.isOpen}
          setIsBookFormOpen={dialogEditModal.setIsOpen}
          bookData={book}
        />
      ) : null}

      <AddBookToShelf
        isOpen={dialogAddShelfModal.isOpen}
        handleClose={dialogAddShelfModal.setIsOpen}
        bookId={book.id}
      />

      <ConfirmDialog
        title="Excluir livro"
        buttonLabel="Deletar"
        description="Deseja excluir este livro?"
        id={book.id}
        queryKeyToInvalidate="books"
        onConfirm={handleConfirmDelete}
        open={dialogDeleteModal.isOpen}
        onOpenChange={dialogDeleteModal.setIsOpen}
      />

      <div
        className={cn("shrink-0", className)}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <DropdownBook
          isOpen={dropdownModal.isOpen}
          onOpenChange={dropdownModal.setIsOpen}
          onToggleFavorite={
            showFavoriteToggle ? () => handleFavoriteClick() : undefined
          }
          isFavorite={book.is_favorite}
          favoriteActionBusy={isFavoritePending}
          trigger={
            <button
              type="button"
              aria-label={`Mais opções para "${book.title}"`}
              className={cn(
                "flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 hover:bg-zinc-100 active:opacity-70 dark:hover:bg-zinc-800",
                triggerClassName,
              )}
            >
              <EllipsisVerticalIcon
                className={cn("size-3.5 text-zinc-400", iconClassName)}
                aria-hidden
                onTouchStart={dropdownTap.handleTouchStart}
                onTouchEnd={dropdownTap.handleTouchEnd}
                onClick={dropdownTap.handleClick}
              />
            </button>
          }
          editBook={handleEdit}
          removeBook={() => dialogDeleteModal.setIsOpen(true)}
          removeBookLabel="Remover livro"
          addToShelf={() => dialogAddShelfModal.setIsOpen(true)}
          shareOnWhatsApp={shareOnWhatsApp}
          schedule={handleNavigateToSchedule}
          quotes={handleNavigateToQuotes}
          isFinishedReading={book.status === "finished"}
          quotesDisabled={book.status !== "not_started"}
        />
      </div>
    </>
  );
}
