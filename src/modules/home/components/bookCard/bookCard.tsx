import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useModal } from "@/hooks/useModal";
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
import { DeleteDialog } from "@/components/deleteModal/deleteModal";
import { BookService } from "../../services/books.services";
import { AddBookToShelf } from "../AddBookToShelf/AddBookToShelf";
import { BookshelfServiceBooks } from "@/modules/bookshelves/services/bookshelvesBooks.service";

type BookCardProps = {
  book: BookDomain;
  isShelf?: boolean;
};

export function BookCard({ book, isShelf = false }: BookCardProps) {
  const dropdownModal = useModal();

  const dialogEditModal = useModal();
  const dialogDeleteModal = useModal();
  const dialogAddShelfModal = useModal();

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
              month: "long",
              day: "numeric",
            })}
          </Badge>
        )}
        <Badge className="bg-amber-500 text-white">
          Leitores: {book.readers}
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

  function generateWhatsAppShareLink(): string {
    const baseUrl = "https://nosso-tbr.vercel.app/";
    const encodedTitle = encodeURIComponent(book.title);
    const url = `${baseUrl}?search=${encodedTitle}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(url)}`;
    return whatsappUrl;
  }

  return (
    <>
      <AddBookToShelf
        isOpen={dialogAddShelfModal.isOpen}
        handleClose={dialogAddShelfModal.setIsOpen}
        bookId={book.id ?? ""}
      />
      <DeleteDialog
        title="Excluir livro"
        buttomLabel={!isShelf ? "Deletar" : "Remover"}
        description={
          !isShelf
            ? "Tem certeza que deseja excluir este livro?"
            : "Tem certeza que deseja remover este livro da estante?"
        }
        id={String(book.id)}
        queryKeyToInvalidate="books"
        onDelete={async (id) => {
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
        isOpen={dialogEditModal.isOpen}
        onOpenChange={dialogEditModal.setIsOpen}
        bookData={book}
      />
      <Card className="w-full max-w-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="truncate">{book.title}</CardTitle>
          <CardDescription>
            {book.author} | {book.pages} páginas
          </CardDescription>
          <CardAction>
            <DropdownBook
              isOpen={dropdownModal.isOpen}
              onOpenChange={dropdownModal.setIsOpen}
              trigger={
                <EllipsisVerticalIcon
                  className="w-5 h-5 cursor-pointer"
                  onClick={() => dropdownModal.setIsOpen(true)}
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
              shareOnWhatsApp={() => {
                const whatsappUrl = generateWhatsAppShareLink();
                window.open(whatsappUrl, "_blank");
              }}
            />
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-3 sm:flex-row flex-col w-full">
            <Image
              src={book.image_url as string}
              alt={book.title}
              width={80}
              height={80}
              className="rounded-xl"
              loading="lazy"
            />

            {/* Badges */}
            {renderStatusBadge()}
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-2"></CardFooter>
      </Card>
    </>
  );
}
