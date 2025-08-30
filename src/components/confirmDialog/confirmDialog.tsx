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
import { ConfirmDialogProps } from "./confirmDialog.types";
import { useConfirmDialog } from "./useConfirmDialog";

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
  const {confirmBookMutation, isLoading} = useConfirmDialog({onConfirm, id, queryKeyToInvalidate, onOpenChange, title, description, open});
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
            isLoading={isLoading}
            type="button"
            onClick={() =>confirmBookMutation()}
          >
            {buttomLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
