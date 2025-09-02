"use client";

import React, { useState } from "react";
import { Controller } from "react-hook-form";
import { useCreateQuoteForm } from "./hooks/useCreateQuoteForm";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type QuoteModalProps = {
  bookId: string;
};

export function CreateQuoteModal({ bookId }: QuoteModalProps) {
  const [open, setOpen] = useState(false);
  const { onSubmit, isSubmitting, errors, register, control, handleSubmit } =
    useCreateQuoteForm({ bookId, onSuccessCloseModal: () => setOpen(false) });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="mb-4">Adicionar Citação</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar Citação</DialogTitle>
          <DialogDescription>
            Preencha as informações abaixo para criar uma nova citação do livro.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 mt-4">
          {/* Campo de conteúdo usando Textarea */}
          <div className="space-y-2">
            <Label htmlFor="content">Citação</Label>
            <Textarea
              id="content"
              placeholder="Digite o conteúdo da citação"
              {...register("content")}
            />
            {errors.content && (
              <p className="text-red-500 text-sm">{errors.content.message}</p>
            )}
          </div>

          {/* Campo opcional de página */}
          <div className="space-y-2">
            <Label htmlFor="page">Página (opcional)</Label>
            <Controller
              control={control}
              name="page"
              render={({ field }) => (
                <Input
                  id="page"
                  type="number"
                  placeholder="Número da página"
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === "" ? undefined : Number(value));
                  }}
                />
              )}
            />
            {errors.page && (
              <p className="text-red-500 text-sm">{errors.page.message}</p>
            )}
          </div>

          <DialogFooter className="flex justify-end px-0 mt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? "Adicionando..." : "Adicionar Citação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
