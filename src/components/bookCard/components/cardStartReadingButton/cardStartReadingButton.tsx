"use client";

import { PlayCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  cardFooterActionButtonClassName,
  cardFooterActionButtonIconClassName,
} from "@/components/bookCard/constants/cardFooterActionButton";
import { cn } from "@/lib/utils";

import { useCardStartReadingButton } from "./hooks/useCardStartReadingButton";
import type { CardStartReadingButtonProps } from "./types/cardStartReadingButton.types";

function CardStartReadingButton({
  bookTitle,
  onStartReading,
  isPending = false,
  label = "Iniciar leitura",
  className,
}: CardStartReadingButtonProps) {
  const {
    confirmationOpen,
    setConfirmationOpen,
    confirmationCopy,
    handleOpenConfirmation,
    handleConfirm,
    handleCancel,
  } = useCardStartReadingButton({
    bookTitle,
    label,
    onStartReading,
    isPending,
  });

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        className={cn(cardFooterActionButtonClassName, className)}
        onClick={handleOpenConfirmation}
      >
        <PlayCircle className={cardFooterActionButtonIconClassName} aria-hidden />
        {label}
      </Button>

      <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{confirmationCopy.title}</DialogTitle>
            <DialogDescription>{confirmationCopy.description}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              className={cn(
                "border-emerald-200/80 bg-emerald-50/50 text-emerald-800 hover:bg-emerald-100/80",
                "dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-200 dark:hover:bg-emerald-950/50",
              )}
              onClick={handleConfirm}
            >
              {confirmationCopy.confirmLabel}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default CardStartReadingButton;
