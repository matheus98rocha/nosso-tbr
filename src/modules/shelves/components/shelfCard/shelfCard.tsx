import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/linkButton/linkButton";
import { EllipsisVerticalIcon } from "lucide-react";
import { useModal } from "@/hooks/useModal";
import {
  BookshelfDomain,
  SelectedBookshelf,
} from "../../types/bookshelves.types";
import { CreateEditBookshelves } from "../createEditBookshelves/createEditBookshelves";
import { DropdownShelf } from "../dropdownShelf/dropdownShelf";
import { DeleteDialog } from "@/components/deleteModal/deleteModal";
import { BookshelfService } from "../../services/booksshelves.service";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Props = {
  shelf: BookshelfDomain;
  openAddBookDialog: (shelf: SelectedBookshelf) => void;
};

export function ShelfCard({ shelf, openAddBookDialog }: Props) {
  const dropdownModal = useModal();
  const editShelve = useModal();
  const deleteShelf = useModal();

  return (
    <>
      <CreateEditBookshelves
        isOpen={editShelve.isOpen}
        handleClose={editShelve.setIsOpen}
        shelf={shelf}
      />

      <DeleteDialog
        id={shelf.id}
        open={deleteShelf.isOpen}
        onOpenChange={deleteShelf.setIsOpen}
        title="Excluir estante"
        description="Tem certeza que deseja excluir esta estante?"
        queryKeyToInvalidate="bookshelves"
        onDelete={async (id) => {
          const service = new BookshelfService();
          await service.delete(id);
        }}
      />

      <Card className="w-full max-w-sm">
        <CardHeader>
          <Tooltip>
            <TooltipTrigger asChild>
              <CardTitle className="truncate">{shelf.name}</CardTitle>
            </TooltipTrigger>
            <TooltipContent>{shelf.name}</TooltipContent>
          </Tooltip>
          <CardDescription>
            <div className="flex items-center gap-1">
              <span className="font-medium text-gray-900">{shelf.owner}</span>
              <span>:</span>
              <span className="text-gray-600">
                {shelf.books.length === 0
                  ? " Nenhum livro"
                  : ` ${shelf.books.length} livro${
                      shelf.books.length !== 1 ? "s" : ""
                    }`}
              </span>
            </div>
          </CardDescription>
          <CardAction>
            <DropdownShelf
              isOpen={dropdownModal.isOpen}
              onOpenChange={dropdownModal.setIsOpen}
              trigger={
                <EllipsisVerticalIcon
                  className="w-5 h-5 cursor-pointer"
                  onClick={() => dropdownModal.setIsOpen(true)}
                />
              }
              editShelve={() => {
                editShelve.setIsOpen(true);
              }}
              removeShelve={() => {
                deleteShelf.setIsOpen(true);
              }}
            />
          </CardAction>
        </CardHeader>
        <CardContent className="relative flex items-center justify-center flex-col">
          <div className="relative h-40 w-[180px] mb-4">
            {shelf.books.slice(0, 3).map((book, index) => (
              <div
                key={book.id}
                className="absolute w-24 h-40 rounded overflow-hidden"
                style={{
                  left: `${index * 40}px`,
                  zIndex: index,
                }}
              >
                <Image
                  src={book.imageUrl as string}
                  alt={`Book ${index}`}
                  width={96}
                  height={160}
                  className="object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
          <Button
            variant={"outline"}
            onClick={() =>
              openAddBookDialog({
                id: shelf.id,
                name: shelf.name,
                owner: shelf.owner,
              })
            }
          >
            Adicionar Livro a essa Estante
          </Button>
        </CardContent>

        <CardFooter>
          <LinkButton
            href={`/bookshelves/${shelf.id}`}
            label="Acessar Estante"
          />
        </CardFooter>
      </Card>
    </>
  );
}
