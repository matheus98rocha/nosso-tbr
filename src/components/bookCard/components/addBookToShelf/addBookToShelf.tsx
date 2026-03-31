import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components";
import { AddBookToShelfProps } from "./types/addBookToShelf.types";
import { useAddBookToShelf } from "./hooks/useAddBookToShelf";

export function AddBookToShelf({ isOpen, handleClose, bookId }: AddBookToShelfProps) {
  const {
    bookshelfOptions,
    handleSubmit,
    isLoading,
    isPending,
    selectedShelfId,
    setSelectedShelfId,
  } = useAddBookToShelf({ isOpen, handleClose, bookId });

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar livro a uma estante</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando estantes...</p>
        ) : (
          <SelectField
            items={bookshelfOptions}
            value={selectedShelfId}
            onChange={setSelectedShelfId}
            placeholder="Selecione uma estante"
          />
        )}

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={!selectedShelfId || isPending}
          >
            {isPending ? "Adicionando..." : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
