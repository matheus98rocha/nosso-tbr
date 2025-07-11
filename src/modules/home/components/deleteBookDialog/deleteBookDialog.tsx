import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookService } from "@/modules/home/services/books.services";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type DeleteBookDialogProps = {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeleteBookDialog({
  id,
  open,
  onOpenChange,
}: DeleteBookDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const service = new BookService();
      await service.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Excluir livro</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir este livro?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            isLoading={mutation.isPending}
            type="button"
            onClick={() => mutation.mutate()}
          >
            Deletar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
