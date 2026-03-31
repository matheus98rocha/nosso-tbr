"use client";

import Image from "next/image";
import { EllipsisVerticalIcon, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownBook } from "./components/dropdownBook";
import { BookUpsert } from "@/modules/bookUpsert";
import { ConfirmDialog } from "@/components";
import { AddBookToShelf } from "./components/addBookToShelf";
import { useBookCard } from "./hooks/useBookCard";
import { BookCardProps } from "./types/bookCard.types";
import { getGenderLabel, getGenreBadgeColor } from "@/constants/genders";
import { cn } from "@/lib/utils";
import { resolveBookCoverUrl } from "@/constants/bookCover";

export function BookCard({ book: bookProp, isShelf = false }: BookCardProps) {
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
  } = useBookCard({ book: bookProp, isShelf });

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
        onConfirm={async (id: string) => handleConfirmDelete(id, isShelf)}
        open={dialogDeleteModal.isOpen}
        onOpenChange={dialogDeleteModal.setIsOpen}
      />

      <BookUpsert
        isBookFormOpen={dialogEditModal.isOpen}
        setIsBookFormOpen={dialogEditModal.setIsOpen}
        bookData={book}
      />

      <Card className="group overflow-hidden border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-3">
          <div className="flex gap-3">
            <div className="relative shrink-0 w-[90px] h-[130px] rounded-md overflow-hidden shadow-sm">
              <Image
                src={resolveBookCoverUrl(book.image_url)}
                alt={book.title}
                fill
                className="object-cover"
                loading="lazy"
              />
            </div>

            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1 mb-0.5">
                <p className="text-sm font-semibold leading-snug line-clamp-2 text-zinc-900 dark:text-zinc-100">
                  {book.title}
                </p>

                {isLogged && (
                  <DropdownBook
                    isOpen={dropdownModal.isOpen}
                    onOpenChange={dropdownModal.setIsOpen}
                    trigger={
                      <button className="flex items-center justify-center w-11 h-11 -mr-2 shrink-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 rounded-full transition-all duration-200 cursor-pointer">
                        <EllipsisVerticalIcon
                          className="w-4 h-4 text-zinc-400"
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
                onClick={handleNavigateToAuthor}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline active:scale-95 truncate text-left mb-2 cursor-pointer transition-all duration-200"
              >
                {book.author}
              </button>

              <div className="flex flex-col gap-1.5 mt-auto">
                {statusDisplay && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 w-fit text-[10px] font-semibold px-2 py-0.5 rounded-full",
                      statusDisplay.colorClass,
                    )}
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        statusDisplay.dotClass,
                      )}
                    />
                    {statusDisplay.label}
                  </span>
                )}

                <div className="flex items-center gap-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                  <Users size={10} className="shrink-0" />
                  <span className="truncate">{book.readersDisplay}</span>
                </div>

                {book.gender && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "w-fit text-[10px] px-2 py-0 h-5 font-medium border-none uppercase",
                      getGenreBadgeColor(book.gender),
                    )}
                  >
                    {getGenderLabel(book.gender)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
