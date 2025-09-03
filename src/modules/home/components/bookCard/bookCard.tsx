import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookDomain } from "@/types/books.types";
import { EllipsisVerticalIcon } from "lucide-react";
import { DropdownBook } from "../dropdownBook/dropdownBook";
import { BookUpsert } from "../../../bookUpsert/bookUpsert";
import { Badge } from "@/components/ui/badge";
import {
  getGenderLabel,
  getGenreBadgeColor,
} from "@/modules/home/utils/genderBook";
import Image from "next/image";
import { ConfirmDialog } from "@/components/confirmDialog/confirmDialog";
import { BookService } from "../../../../services/books/books.service";
import { AddBookToShelf } from "../AddBookToShelf/AddBookToShelf";
import { BookshelfServiceBooks } from "@/modules/bookshelves/services/bookshelvesBooks.service";
import { useBookCard } from "./hooks/useBookCard";

type BookCardProps = {
  book: BookDomain;
  isShelf?: boolean;
};

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
  } = useBookCard({
    book: bookProp,
    isShelf,
  });

  // Function to render the status badge based on book status
  const renderStatusBadge = () => {
    return (
      <div className="flex items-center justify-start gap-2 flex-wrap">
        <Badge
          className={
            book.status === "not_started"
              ? "bg-gray-500 text-white"
              : book.status === "reading"
              ? "bg-green-800 text-white"
              : "bg-red-500 text-white"
          }
        >
          {book.status === "reading"
            ? "Já iniciei a leitura"
            : book.status === "finished"
            ? "Terminei a Leitura"
            : "Vou iniciar a leitura"}
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
        buttomLabel={!isShelf ? "Deletar" : "Remover"}
        description={
          !isShelf
            ? "Tem certeza que deseja excluir este livro?"
            : "Tem certeza que deseja remover este livro da estante?"
        }
        id={String(book.id)}
        queryKeyToInvalidate="books"
        onConfirm={async (id: string) => {
          if (!isShelf) {
            const service = new BookService();
            await service.delete(id);
          } else {
            const service = new BookshelfServiceBooks();
            await service.removeBookFromShelf(id);
            window.location.reload();
          }
        }}
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
                isStartedReading={book.status === "reading"}
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
