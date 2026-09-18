"use client";

import { BookPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  cardFooterActionButtonClassName,
  cardFooterActionButtonIconClassName,
} from "@/components/bookCard/constants/cardFooterActionButton";
import { cn } from "@/lib/utils";

import type { CardAddToLibraryButtonProps } from "./types/cardAddToLibraryButton.types";

export default function CardAddToLibraryButton({
  bookTitle,
  onAddToLibrary,
  isPending = false,
}: CardAddToLibraryButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      className={cn(cardFooterActionButtonClassName)}
      onClick={onAddToLibrary}
      aria-label={`Adicionar "${bookTitle}" à minha biblioteca`}
    >
      <BookPlus className={cardFooterActionButtonIconClassName} aria-hidden />
      Adicionar à biblioteca
    </Button>
  );
}
