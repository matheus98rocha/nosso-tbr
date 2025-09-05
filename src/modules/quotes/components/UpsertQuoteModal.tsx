"use client";

import React, { useState } from "react";
import { Controller } from "react-hook-form";

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
import { UpsertQuoteModalProps } from "../types/quotes.types";
import { useUpsertQuoteModal } from "./hooks/useUpsertQuoteModal";
import { PencilIcon } from "lucide-react";

export function UpsertQuoteModal({ id: bookId, quote }: UpsertQuoteModalProps) {
  const [open, setOpen] = useState(false);
  const isEditing = !!quote;

  const {
    onSubmit,
    isSubmitting,
    errors,
    register,
    control,
    handleSubmit,
    watch,
  } = useUpsertQuoteModal({
    bookId,
    quote,
    onSuccessCloseModal: () => setOpen(false),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button
            variant="ghost"
            size="icon"
            className="text-black transition-transform transform hover:scale-110"
            aria-label="Editar citação"
          >
            <PencilIcon size={18} />
          </Button>
        ) : (
          <Button className="mb-4">Adicionar Citação</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Citação" : "Adicionar Citação"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informações da citação abaixo."
              : "Preencha as informações abaixo para criar uma nova citação do livro."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="content">Citação</Label>
            <Textarea
              id="content"
              placeholder="Digite o conteúdo da citação"
              {...register("content")}
              maxLength={200}
            />
            <div className="flex justify-between items-center text-sm text-gray-500">
              {errors.content && (
                <p className="text-red-500">{errors.content.message}</p>
              )}
              <span>{(watch("content") || "").length}/200</span>
            </div>
          </div>

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
              {isSubmitting
                ? isEditing
                  ? "Salvando..."
                  : "Adicionando..."
                : isEditing
                ? "Salvar Alterações"
                : "Adicionar Citação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
