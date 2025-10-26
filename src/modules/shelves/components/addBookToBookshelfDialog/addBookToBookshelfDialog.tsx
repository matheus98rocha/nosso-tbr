import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookService } from "@/services/books/books.service";
import { BookCombobox } from "../bookCombobox/bookCombobox";
import { BookshelfService } from "../../services/booksshelves.service";
import { SelectedBookshelf } from "../../types/bookshelves.types";

type AddBookToBookshelfDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  bookshelfe: SelectedBookshelf;
};

export function AddBookToBookshelfDialog({
  isOpen,
  onOpenChange,
  bookshelfe,
}: AddBookToBookshelfDialogProps) {
  const [selectedBookId, setSelectedBookId] = useState("");
  const queryClient = useQueryClient();

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["books"],
    queryFn: async () => {
      const service = new BookService();
      return service.getAll({});
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const service = new BookshelfService();
      await service.addBookToShelf(bookshelfe.id, selectedBookId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookshelves"] });
      setSelectedBookId("");
      onOpenChange(false);
    },
  });

  const handleSubmit = () => {
    if (selectedBookId) mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            Adicionar livro à estante - {bookshelfe.name ?? ""}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando livros...</p>
        ) : (
          <BookCombobox
            books={books}
            value={selectedBookId}
            onChange={setSelectedBookId}
          />
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedBookId || isPending}
          >
            {isPending ? "Adicionando..." : "Adicionar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
