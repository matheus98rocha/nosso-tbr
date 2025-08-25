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
import { ConfirmDialog } from "@/components/confirmDialog/confirmDialog";
import { BookshelfService } from "../../services/booksshelves.service";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";

type Props = {
  shelf: BookshelfDomain;
  openAddBookDialog: (shelf: SelectedBookshelf) => void;
};

export function ShelfCard({ shelf, openAddBookDialog }: Props) {
  const dropdownModal = useModal();
  const editShelve = useModal();
  const deleteShelf = useModal();
  const isLogged = useIsLoggedIn();

  return (
    <>
      <CreateEditBookshelves
        isOpen={editShelve.isOpen}
        handleClose={editShelve.setIsOpen}
        editShelf={shelf}
      />

      <ConfirmDialog
        id={shelf.id}
        open={deleteShelf.isOpen}
        onOpenChange={deleteShelf.setIsOpen}
        title="Excluir estante"
        buttomLabel="Excluir"
        description="Tem certeza que deseja excluir esta estante?"
        queryKeyToInvalidate="bookshelves"
        onConfirm={async (id: string) => {
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
          {isLogged && (
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
          )}
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
          {isLogged && (
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
          )}
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
