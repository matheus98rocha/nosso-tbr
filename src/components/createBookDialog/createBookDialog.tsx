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
import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "../datePicker/datePicker";
import { SelectField } from "../select/select.";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookCreateValidator } from "@/types/books.types";
import { bookCreateSchema } from "@/validators/createBook.validator";
import { useCreateBookDialog } from "./useCreateBookDialog";
import { Checkbox } from "../ui/checkbox";

type CreateBookProps = {
  trigger: ReactNode;
};

export function CreateBookDialog({ trigger }: CreateBookProps) {
  const [selected, setSelected] = useState<
    "will_start_reading" | "started_reading" | "finished_reading" | null
  >(null);
  const { register, handleSubmit, control, reset } =
    useForm<BookCreateValidator>({
      resolver: zodResolver(bookCreateSchema),
    });

  const { onSubmit, isLoading, open, setOpen } = useCreateBookDialog({
    reset,
  });

  const checkboxes: {
    id: "will_start_reading" | "started_reading" | "finished_reading";
    label: string;
  }[] = [
    { id: "will_start_reading", label: "Vou iniciar a leitura" },
    { id: "started_reading", label: "Já iniciei a leitura" },
    { id: "finished_reading", label: "Terminei a Leitura" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <DialogContent className="h-full sm:h-fit max-w-[425px] overflow-scroll sm:overflow-auto">
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

          {/* Checkbox */}
          <div className="grid gap-3">
            <Label>Status da leitura</Label>
            <div className="flex items-start justify-center flex-col gap-3">
              {checkboxes.map(({ id, label }) => (
                <div key={id} className="flex items-center gap-2">
                  <Checkbox
                    id={id}
                    checked={selected === id}
                    onCheckedChange={() => setSelected(id)}
                  />
                  <Label htmlFor={id}>{label}</Label>
                </div>
              ))}
            </div>
          </div>

          {
            <>
              {selected !== "will_start_reading" && selected !== null && (
                <>
                  <Controller
                    name="start_date"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        title="Data de Início da Leitura"
                        value={field.value ? new Date(field.value) : undefined}
                        onChange={(date) =>
                          field.onChange(date?.toISOString() ?? null)
                        }
                      />
                    )}
                  />
                  {selected === "finished_reading" && (
                    <Controller
                      name="end_date"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          title="Data de Termino da Leitura"
                          value={
                            field.value ? new Date(field.value) : undefined
                          }
                          onChange={(date) =>
                            field.onChange(date?.toISOString() ?? null)
                          }
                        />
                      )}
                    />
                  )}
                </>
              )}
            </>
          }
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
