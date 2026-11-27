"use client";

import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { FocusSessionDialogProps } from "../../types/focus.components.types";

export default function FocusSessionDialog({
  summary,
  suggestedPage,
  isSaving,
  onConfirm,
  onCancel,
}: FocusSessionDialogProps) {
  const [page, setPage] = useState(String(suggestedPage));

  useEffect(() => {
    if (summary) {
      setPage(String(suggestedPage));
    }
  }, [summary, suggestedPage]);

  const book = summary?.book ?? null;
  const min = book ? book.currentPage : 0;
  const max = book ? book.pages : undefined;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (page.trim() === "") return;

    onConfirm(Number(page));
  };

  return (
    <Dialog
      open={summary !== null}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar sua leitura</DialogTitle>
          <DialogDescription>
            {book
              ? `Você estava na página ${book.currentPage} de ${book.pages}. Em qual página parou?`
              : "Quantas páginas você leu nesta sessão?"}
          </DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={handleSubmit} className="space-y-2">
          <Label htmlFor="focus-final-page">
            {book ? "Página final" : "Páginas lidas"}
          </Label>
          <Input
            id="focus-final-page"
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            step={1}
            value={page}
            disabled={isSaving}
            onChange={(event) => setPage(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Sugestão com base na sua meta e no tempo de foco: {suggestedPage}
            {book ? ` de ${book.pages}` : ""}.
          </p>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={onCancel}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving || page.trim() === ""}>
              {isSaving ? "Salvando..." : "Salvar sessão"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
