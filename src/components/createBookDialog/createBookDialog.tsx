"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "../datePicker/datePicker";
import { SelectField } from "../select/select.";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookCreateValidator } from "@/types/books.types";
import { bookCreateSchema } from "@/validators/createBook.validator";
import { useCreateBookDialog } from "./useCreateBookDialog";

type CreateBookProps = {
  trigger: ReactNode;
};

export function CreateBookDialog({ trigger }: CreateBookProps) {
  const { register, handleSubmit, control, reset } =
    useForm<BookCreateValidator>({
      resolver: zodResolver(bookCreateSchema),
    });

  const { onSubmit, isLoading, open, setOpen } = useCreateBookDialog({
    reset,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicione um novo livro</DialogTitle>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-3">
            <Label htmlFor="title">Nome do Livro</Label>
            <Input id="title" {...register("title")} />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="author">Autor</Label>
            <Input id="author" {...register("author")} />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="pages">Número de páginas</Label>
            <Input
              id="pages"
              type="number"
              {...register("pages", { valueAsNumber: true })}
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="chosen_by">Quem escolheu?</Label>
            <Controller
              name="chosen_by"
              control={control}
              render={({ field }) => (
                <SelectField
                  value={field.value}
                  onChange={field.onChange}
                  items={[
                    { label: "Matheus", value: "Matheus" },
                    { label: "Fabi", value: "Fabi" },
                    { label: "Barbara", value: "Barbara" },
                  ]}
                />
              )}
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="readers">Quem vai ler o livro?</Label>
            <Controller
              name="readers"
              control={control}
              render={({ field }) => (
                <SelectField
                  value={field.value}
                  onChange={field.onChange}
                  items={[
                    { label: "Matheus", value: "Matheus" },
                    { label: "Fabi", value: "Fabi" },
                    { label: "Matheus e Fabi", value: "Matheus e Fabi" },
                    { label: "Barbara e Fabi", value: "Barbara e Fabi" },
                  ]}
                />
              )}
            />
          </div>
          <Controller
            name="start_date"
            control={control}
            render={({ field }) => (
              <DatePicker
                title="Data de Início da Leitura"
                value={field.value ? new Date(field.value) : undefined}
                onChange={(date) => field.onChange(date?.toISOString() ?? null)}
              />
            )}
          />
          <Controller
            name="end_date"
            control={control}
            render={({ field }) => (
              <DatePicker
                title="Data de Termino da Leitura"
                value={field.value ? new Date(field.value) : undefined}
                onChange={(date) => field.onChange(date?.toISOString() ?? null)}
              />
            )}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" isLoading={isLoading}>
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
