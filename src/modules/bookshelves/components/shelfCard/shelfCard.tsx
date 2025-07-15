import {
  Card,
  CardAction,
  CardContent,
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
          <CardTitle>{shelf.name}</CardTitle>
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
        <CardContent>
          <Button
            variant={"outline"}
            onClick={() =>
              openAddBookDialog({
                id: shelf.id,
                name: shelf.name,
              })
            }
          >
            Adicionar Livro a essa Estante
          </Button>
        </CardContent>
        <CardFooter>
          <LinkButton
            href={`/bookshelvesBooks/${shelf.id}`}
            label="Acessar Estante"
          />
        </CardFooter>
      </Card>
    </>
  );
}
