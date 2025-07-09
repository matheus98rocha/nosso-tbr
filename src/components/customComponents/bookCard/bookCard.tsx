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
import { BookDialog } from "../bookDialog/bookDialog";
import { DeleteBookDialog } from "../deleteBookDialog/deleteBookDialog";
import { Badge } from "@/components/ui/badge";
import { getGenderLabel } from "@/utils/genderBook";

type BookCardProps = {
  book: BookDomain;
};

export function BookCard({ book }: BookCardProps) {
  const dropdownModal = useModal();

  const dialogEditModal = useModal();
  const dialogDeleteModal = useModal();

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
          <CardDescription>{book.author}</CardDescription>
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
                dialogDeleteModal.setIsOpen(true);
                // dropdownModal.setIsOpen(false);
              }}
              removeBook={() => {
                // Implement remove book logic here
                dialogDeleteModal.setIsOpen(true);
              }}
            />
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-start gap-2 flex-wrap">
            <Badge className="bg-blue-500 text-white">
              {book.pages} páginas
            </Badge>

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

            {book.gender && (
              <Badge className="bg-purple-500 text-white">
                {" "}
                {getGenderLabel(book.gender)}
              </Badge>
            )}

            <Badge className="bg-amber-500 text-white">
              Escolhido por: {book.chosen_by}
            </Badge>

            <Badge className="bg-amber-500 text-white">
              Leitores: {book.readers}
            </Badge>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-2"></CardFooter>
      </Card>
    </>
  );
}
