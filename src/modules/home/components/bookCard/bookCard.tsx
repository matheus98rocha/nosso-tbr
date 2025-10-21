import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EllipsisVerticalIcon } from "lucide-react";
import { DropdownBook } from "../dropdownBook/dropdownBook";
import { BookUpsert } from "../../../bookUpsert/bookUpsert";
import { Badge } from "@/components/ui/badge";

import Image from "next/image";
import { ConfirmDialog } from "@/components/confirmDialog/confirmDialog";
import { AddBookToShelf } from "../AddBookToShelf/AddBookToShelf";
import { useBookCard } from "./hooks/useBookCard";
import { BookCardProps } from "./types/bookCard.types";
import { getGenderLabel, getGenreBadgeColor } from "@/constants/genders";

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
    isLogged,
    handleNavigateToQuotes,
    badgeObject,
    handleConfirmDelete,
  } = useBookCard({
    book: bookProp,
    isShelf,
  });

  const renderStatusBadge = () => {
    return (
      <div className="flex items-center justify-start gap-2 flex-wrap">
        <Badge className={badgeObject.bookStatusClass}>
          {badgeObject.bookStatusText}
        </Badge>

        {book.status === "finished" && book.end_date && (
          <Badge className={"bg-red-500 text-white"}>
            Finalizado em:{" "}
            {new Date(book.end_date).toLocaleDateString("pt-BR", {
              year: "numeric",
              month: "numeric",
              day: "numeric",
            })}
          </Badge>
        )}
        <Badge className="bg-amber-500 text-white">
          {book.readers === "Barbara,Fabi e Matheus"
            ? "Leitores: 3 (Todos)"
            : `Leitores: ${book.readers}`}
        </Badge>

        <Badge className="bg-amber-500 text-white">
          Escolhido por: {book.chosen_by}
        </Badge>

        {book.gender && (
          <Badge className={getGenreBadgeColor(book.gender)}>
            {getGenderLabel(book.gender)}
          </Badge>
        )}
      </div>
    );
  };

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
          !isShelf
            ? "Tem certeza que deseja excluir este livro?"
            : "Tem certeza que deseja remover este livro da estante?"
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
      <Card className="w-full max-w-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="truncate">{book.title}</CardTitle>
          <CardDescription>
            {book.author} | {book.pages} páginas
          </CardDescription>

          {isLogged && (
            <CardAction>
              <DropdownBook
                isOpen={dropdownModal.isOpen}
                onOpenChange={dropdownModal.setIsOpen}
                trigger={
                  <EllipsisVerticalIcon
                    className="w-5 h-5 cursor-pointer"
                    onTouchStart={dropdownTap.handleTouchStart}
                    onTouchEnd={dropdownTap.handleTouchEnd}
                    onClick={dropdownTap.handleClick}
                  />
                }
                editBook={() => {
                  dialogEditModal.setIsOpen(true);
                }}
                removeBook={() => {
                  dialogDeleteModal.setIsOpen(true);
                }}
                addToShelf={() => {
                  dialogAddShelfModal.setIsOpen(true);
                }}
                shareOnWhatsApp={() => shareOnWhatsApp()}
                schedule={() => handleNavigateToSchedule()}
                quotes={() => handleNavigateToQuotes()}
                isStartedReading={book.status === "reading"}
                quotesDisabled={book.status !== "not_started"}
              />
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[80px_auto] gap-3 w-full">
            <div className="relative w-[80px] h-[120px]">
              <Image
                src={book.image_url as string}
                alt={book.title}
                fill
                sizes="(max-width: 640px) 100vw, 640px"
                className="rounded-xl object-cover h-auto w-auto "
                loading="eager"
              />
            </div>

            {/* Badges */}
            <div className="flex flex-col gap-1">{renderStatusBadge()}</div>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-2"></CardFooter>
      </Card>
    </>
  );
}
