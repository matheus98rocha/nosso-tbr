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
import { BookOpen, EllipsisVerticalIcon, Plus } from "lucide-react";
import { useModal } from "@/hooks/useModal";
import {
  BookshelfDomain,
  SelectedBookshelf,
} from "../../types/bookshelves.types";
import { CreateEditBookshelves } from "../createEditBookshelves";
import { DropdownShelf } from "../dropdownShelf";
import { ConfirmDialog } from "@/components/confirmDialog";
import { BookshelfService } from "../../services/booksshelves.service";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import Link from "next/link";
import { getBookshelfBooksPath } from "@/lib/routes/shelves";

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
                      type="button"
                      className="flex min-h-11 min-w-11 items-center justify-center rounded-md transition-colors duration-150 hover:bg-muted cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      onClick={() => dropdownModal.setIsOpen(true)}
                      aria-label={`Opções da estante ${shelf.name}`}
                      aria-haspopup="menu"
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
                <BookOpen className="h-8 w-8" strokeWidth={1} aria-hidden />
                <span className="text-xs">Nenhum livro ainda</span>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 pt-0">
          <Button
            asChild
            className="h-auto min-h-11 w-full cursor-pointer gap-2 py-3 transition-colors duration-200"
          >
            <Link
              href={getBookshelfBooksPath(shelf.id)}
              aria-label={`Acessar estante ${shelf.name} e ver os livros`}
            >
              Acessar estante
            </Link>
          </Button>
          {isLogged && (
            <Button
              type="button"
              variant="outline"
              className="h-auto min-h-11 w-full cursor-pointer gap-2 py-3 transition-colors duration-200"
              onClick={handleOpenAddBook}
              aria-label={`Adicionar livro à estante ${shelf.name}`}
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
              Adicionar livro
            </Button>
          )}
        </CardFooter>
      </Card>
    </>
  );
}
