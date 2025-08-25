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
import { useMutation, useQueryClient } from "@tanstack/react-query";

type ConfirmDialogProps = {
  title: string;
  description: string;
  id: string;
  queryKeyToInvalidate: string;
  onConfirm: (id: string) => Promise<void>;
  onCancel?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buttomLabel?: string;
};

export function ConfirmDialog({
  title,
  description,
  id,
  queryKeyToInvalidate,
  onConfirm,
  onCancel,
  open,
  onOpenChange,
  buttomLabel,
}: ConfirmDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => onConfirm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeyToInvalidate] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button onClick={onCancel} variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            isLoading={mutation.isPending}
            type="button"
            onClick={() => mutation.mutate()}
          >
            {buttomLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
