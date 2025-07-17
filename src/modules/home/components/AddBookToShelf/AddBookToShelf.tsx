import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation"; // ajuste para seu setup Next.js
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/modules/home/components/select/select.";
import { BookshelfService } from "@/modules/shelves/services/booksshelves.service";
import { SelectedBookshelf } from "@/modules/shelves/types/bookshelves.types";

type AddBookToShelfProps = {
  isOpen: boolean;
  handleClose: (open: boolean) => void;
  bookId: string;
};

export function AddBookToShelf({
  isOpen,
  handleClose,
  bookId,
}: AddBookToShelfProps) {
  const [selectedShelfId, setSelectedShelfId] = useState("");
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: bookshelves = [], isLoading } = useQuery({
    queryKey: ["bookshelves"],
    queryFn: async () => {
      const service = new BookshelfService();
      return service.getAll();
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const service = new BookshelfService();
      await service.addBookToShelf(selectedShelfId, bookId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookshelves"] });
      setSelectedShelfId("");
      handleClose(false);
      router.push(`/bookshelves/${selectedShelfId}`);
    },
  });

  const handleSubmit = () => {
    if (selectedShelfId) mutate();
  };

  const bookshelfOptions =
    bookshelves?.map((shelf: SelectedBookshelf) => ({
      label: shelf.name,
      value: shelf.id,
    })) ?? [];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar livro a uma estante</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">
            Carregando estantes...
          </p>
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
