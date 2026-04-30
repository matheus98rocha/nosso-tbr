import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QUERY_KEYS } from "@/constants/keys";
import { SHELF_BOOK_CANNOT_ADD_MESSAGE } from "@/constants/shelfBook";
import { BookService } from "@/services/books/books.service";
import { BookCombobox } from "../bookCombobox";
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
      return (await service.getAll({})).data;
    },
  });

  const booksForCombobox = useMemo(() => {
    const ids = new Set(bookshelfe.bookIdsOnShelf ?? []);
    if (ids.size === 0) return books;
    return books.filter((b) => b.id != null && !ids.has(b.id));
  }, [books, bookshelfe.bookIdsOnShelf]);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const service = new BookshelfService();
      await service.addBookToShelf(bookshelfe.id, selectedBookId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.shelves.all });
      setSelectedBookId("");
      onOpenChange(false);
    },
    onError: () => {
      toast(SHELF_BOOK_CANNOT_ADD_MESSAGE, { className: "toast-error" });
    },
  });

  const handleSubmit = useCallback(() => {
    if (selectedBookId) mutate();
  }, [selectedBookId, mutate]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <BookPlus className="w-5 h-5 text-primary shrink-0" strokeWidth={1.5} />
            <DialogTitle className="text-base">Adicionar livro</DialogTitle>
          </div>
          {bookshelfe.name && (
            <DialogDescription className="text-sm">
              Estante:{" "}
              <span className="font-medium text-foreground">
                {bookshelfe.name}
              </span>
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="py-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-3 text-center">
              Carregando livros...
            </p>
          ) : (
            <BookCombobox
              books={booksForCombobox}
              value={selectedBookId}
              onChange={setSelectedBookId}
            />
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="min-h-[44px] cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedBookId || isPending}
            className="min-h-[44px] cursor-pointer"
          >
            {isPending ? "Adicionando..." : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
