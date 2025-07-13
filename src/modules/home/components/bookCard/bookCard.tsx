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
import { BookDomain } from "@/modules/home/types/books.types";
import { EllipsisVerticalIcon } from "lucide-react";
import { DropdownBook } from "../dropdownBook/dropdownBook";
import { BookDialog } from "../bookDialog/bookDialog";
import { DeleteBookDialog } from "../deleteBookDialog/deleteBookDialog";
import { Badge } from "@/components/ui/badge";
import {
  getGenderLabel,
  getGenreBadgeColor,
} from "@/modules/home/utils/genderBook";
import Image from "next/image";

type BookCardProps = {
  book: BookDomain;
};

export function BookCard({ book }: BookCardProps) {
  const dropdownModal = useModal();

  const dialogEditModal = useModal();
  const dialogDeleteModal = useModal();

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

  return (
    <>
      <DeleteBookDialog
        open={dialogDeleteModal.isOpen}
        onOpenChange={dialogDeleteModal.setIsOpen}
        id={String(book.id)}
      />
      <BookDialog
        isOpen={dialogEditModal.isOpen}
        onOpenChange={dialogEditModal.setIsOpen}
        bookData={book}
      />

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{book.title}</CardTitle>
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
