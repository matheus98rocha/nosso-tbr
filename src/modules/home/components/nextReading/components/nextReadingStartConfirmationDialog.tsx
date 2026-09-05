"use client";

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

import type { NextReadingStartConfirmationDialogProps } from "../nextReading.types";

export default function NextReadingStartConfirmationDialog({
  bookTitle,
  open,
  isPending,
  onOpenChange,
  onConfirm,
}: NextReadingStartConfirmationDialogProps) {
  if (!bookTitle) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Iniciar leitura?</DialogTitle>
          <DialogDescription>
            {`Ao confirmar, “${bookTitle}” passará a aparecer como leitura em andamento na sua biblioteca.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isPending}>
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" disabled={isPending} onClick={onConfirm}>
            Iniciar leitura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
