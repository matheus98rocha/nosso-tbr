import { memo } from "react";
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
import type { ConfirmDialogProps } from "./confirmDialog.types";
import { useConfirmDialog } from "./hooks/useConfirmDialog";

function ConfirmDialogComponent({
  title,
  description,
  id,
  queryKeyToInvalidate,
  onConfirm,
  onCancel,
  open,
  onOpenChange,
  buttonLabel,
}: ConfirmDialogProps) {
  const { confirmBookMutation, isLoading } = useConfirmDialog({
    onConfirm,
    id,
    queryKeyToInvalidate,
    onOpenChange,
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
            <Button type="button" onClick={onCancel} variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            isLoading={isLoading}
            type="button"
            onClick={() => confirmBookMutation()}
          >
            {buttonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const ConfirmDialog = memo(ConfirmDialogComponent);
