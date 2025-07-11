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
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SelectField } from "../select/select.";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookCreateValidator, Status } from "@/modules/home/types/books.types";
import { bookCreateSchema } from "@/modules/home/validators/createBook.validator";
import { Checkbox } from "../../../../components/ui/checkbox";
import { DatePicker } from "../datePicker/datePicker";
import { useBookDialog } from "./useBookDialog";
import { genders } from "@/modules/utils/genderBook";

type CreateBookProps = {
  bookData?: BookCreateValidator;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BookDialog({
  bookData,
  isOpen,
  onOpenChange,
}: CreateBookProps) {
  const [selected, setSelected] = useState<Status | null>(null);

  const { register, handleSubmit, control, reset } =
    useForm<BookCreateValidator>({
      resolver: zodResolver(bookCreateSchema),
      defaultValues: {
        title: "",
        author: "",
        pages: 0,
        readers: "",
        start_date: null,
        end_date: null,
        gender: "",
        ...bookData,
      },
    });

  const { onSubmit, isLoading } = useBookDialog({
    reset,
    bookData,
    onOpenChange,
  });

  const checkboxes: {
    id: Status;
    label: string;
  }[] = [
    { id: "not_started", label: "Vou iniciar a leitura" },
    { id: "reading", label: "Já iniciei a leitura" },
    { id: "finished", label: "Terminei a Leitura" },
  ];

  useEffect(() => {
    if (bookData) {
      setSelected(bookData.status ?? null);
    } else {
      setSelected(null);
    }
  }, [bookData]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          reset();
          setSelected(null);
        }
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="h-full sm:h-[90%] max-w-[425px] overflow-scroll lg:overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {bookData ? "Editar Livro" : "Adicione um novo livro"}
          </DialogTitle>
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
            <Label htmlFor="gender">Gênero</Label>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <SelectField
                  value={field?.value ?? undefined}
                  onChange={field.onChange}
                  items={genders}
                />
              )}
            />
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
                    onCheckedChange={() =>
                      selected === id ? setSelected(null) : setSelected(id)
                    }
                  />
                  <Label htmlFor={id}>{label}</Label>
                </div>
              ))}
            </div>
          </div>

          {
            <>
              {selected !== "not_started" && selected !== null && (
                <>
                  <Controller
                    name="start_date"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        isAfterTodayHidden={true}
                        title="Data de Início da Leitura"
                        value={field.value ? new Date(field.value) : undefined}
                        onChange={(date) =>
                          field.onChange(date?.toISOString() ?? null)
                        }
                      />
                    )}
                  />
                  {selected === "finished" && (
                    <Controller
                      name="end_date"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          isAfterTodayHidden={true}
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
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" isLoading={isLoading}>
              {bookData ? "Editar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
