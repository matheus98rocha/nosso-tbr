import { useCallback } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EllipsisVerticalIcon, BookOpen, Plus } from "lucide-react";
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
import Link from "next/link";

type Props = {
  shelf: BookshelfDomain;
  openAddBookDialog: (shelf: SelectedBookshelf) => void;
};

export function ShelfCard({ shelf, openAddBookDialog }: Props) {
  const dropdownModal = useModal();
  const editShelve = useModal();
  const deleteShelf = useModal();
  const isLogged = useIsLoggedIn();

  const handleOpenAddBook = useCallback(() => {
    openAddBookDialog({ id: shelf.id, name: shelf.name });
  }, [openAddBookDialog, shelf.id, shelf.name]);

  const bookCount = shelf.books.length;
  const previewBooks = shelf.books.slice(0, 3);
  const hasBooks = bookCount > 0;

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
        buttonLabel="Excluir"
        description="Tem certeza que deseja excluir esta estante?"
        queryKeyToInvalidate="bookshelves"
        onConfirm={async (id: string) => {
          const service = new BookshelfService();
          await service.delete(id);
        }}
      />

      <Card className="w-full group transition-shadow duration-200 hover:shadow-md overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <CardTitle className="block w-full wrap-break-word text-base font-semibold leading-normal">
                  {shelf.name}
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent>{shelf.name}</TooltipContent>
            </Tooltip>

            <div className="flex items-center gap-1.5 shrink-0">
              <Badge variant="secondary" className="text-xs font-medium">
                {bookCount === 0
                  ? "0 livros"
                  : `${bookCount} livro${bookCount !== 1 ? "s" : ""}`}
              </Badge>
              {isLogged && (
                <DropdownShelf
                  isOpen={dropdownModal.isOpen}
                  onOpenChange={dropdownModal.setIsOpen}
                  trigger={
                    <button
                      className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-md hover:bg-muted transition-colors duration-150 cursor-pointer"
                      onClick={() => dropdownModal.setIsOpen(true)}
                      aria-label="Opções da estante"
                    >
                      <EllipsisVerticalIcon className="w-4 h-4 text-muted-foreground" />
                    </button>
                  }
                  editShelve={() => editShelve.setIsOpen(true)}
                  removeShelve={() => deleteShelf.setIsOpen(true)}
                />
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-4">
          <div className="relative h-36 w-full bg-muted/40 rounded-lg flex items-center justify-center overflow-hidden">
            {hasBooks ? (
              <div className="relative w-full h-full flex items-end justify-center pb-2">
                {previewBooks.map((book, index) => (
                  <div
                    key={book.id}
                    className="absolute bottom-2 w-20 h-32 rounded-md overflow-hidden shadow-sm"
                    style={{
                      left: `calc(50% - 40px + ${(index - 1) * 36}px)`,
                      zIndex: index + 1,
                      transform: `rotate(${(index - 1) * 4}deg)`,
                    }}
                  >
                    <Image
                      src={book.imageUrl as string}
                      alt={`Livro ${index + 1} da estante ${shelf.name}`}
                      width={80}
                      height={128}
                      className="object-cover w-full h-full"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground/50 select-none pointer-events-none">
                <BookOpen className="w-8 h-8" strokeWidth={1} />
                <span className="text-xs">Nenhum livro ainda</span>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 pt-0">
          <Link href={`/bookshelves/${shelf.id}`} className="w-full">
            <Button className="w-full min-h-[44px] cursor-pointer transition-colors duration-200">
              Acessar Estante
            </Button>
          </Link>
          {isLogged && (
            <Button
              variant="outline"
              className="w-full min-h-[44px] gap-2 cursor-pointer transition-colors duration-200"
              onClick={handleOpenAddBook}
            >
              <Plus className="w-4 h-4" />
              Adicionar Livro
            </Button>
          )}
        </CardFooter>
      </Card>
    </>
  );
}
