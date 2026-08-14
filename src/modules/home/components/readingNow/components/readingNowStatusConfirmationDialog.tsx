"use client";

import { useMemo } from "react";

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

import type {
  ReadingNowStatusConfirmationDialogProps,
  ReadingNowStatusTransitionStatus,
} from "../readingNow.types";

type StatusConfirmationConfig = {
  title: string;
  getDescription: (bookTitle: string) => string;
  confirmLabel: string;
  variant: "default" | "destructive";
};

const STATUS_CONFIRMATION_CONFIG: Record<
  ReadingNowStatusTransitionStatus,
  StatusConfirmationConfig
> = {
  finished: {
    title: "Finalizar leitura?",
    getDescription: (bookTitle) =>
      `Você está prestes a marcar “${bookTitle}” como lido. O livro deixará de aparecer em “Lendo agora”.`,
    confirmLabel: "Finalizar leitura",
    variant: "default",
  },
  paused: {
    title: "Pausar leitura?",
    getDescription: (bookTitle) =>
      `Você está prestes a pausar “${bookTitle}”. O livro deixará de aparecer em “Lendo agora”, mas você poderá retomá-lo depois.`,
    confirmLabel: "Pausar leitura",
    variant: "default",
  },
  abandoned: {
    title: "Abandonar leitura?",
    getDescription: (bookTitle) =>
      `Você está prestes a abandonar “${bookTitle}”. O livro deixará de aparecer em “Lendo agora”, mas continuará na sua biblioteca.`,
    confirmLabel: "Abandonar leitura",
    variant: "destructive",
  },
};

export default function ReadingNowStatusConfirmationDialog({
  target,
  open,
  isPending,
  onOpenChange,
  onConfirm,
}: ReadingNowStatusConfirmationDialogProps) {
  const config = useMemo(() => {
    if (!target) return null;
    return STATUS_CONFIRMATION_CONFIG[target.nextStatus];
  }, [target]);

  if (!target || !config) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>
            {config.getDescription(target.book.title)}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isPending}>
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant={config.variant}
            disabled={isPending}
            onClick={onConfirm}
          >
            {config.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
