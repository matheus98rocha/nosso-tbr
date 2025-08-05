import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { SelectField } from "../select/select.";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookCreateValidator, Status } from "@/types/books.types";
import { bookCreateSchema } from "@/modules/home/validators/createBook.validator";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "../datePicker/datePicker";
import { useBookDialog } from "./useBookDialog";
import { genders } from "@/modules/home/utils/genderBook";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

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

  const form = useForm<BookCreateValidator>({
    resolver: zodResolver(bookCreateSchema),
    defaultValues: {
      title: "",
      author: "",
      pages: 1,
      readers: "",
      start_date: null,
      end_date: null,
      gender: "",
      image_url: "",
      ...bookData,
    },
  });

  const { reset, handleSubmit, control } = form;

  const { onSubmit, isLoading } = useBookDialog({
    reset,
    bookData,
    onOpenChange,
  });

  const checkboxes: { id: Status; label: string }[] = [
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
      <DialogContent className="h-full sm:max-h-[95%] w-full">
        <DialogHeader>
          <DialogTitle>
            {bookData ? "Editar Livro" : "Adicione um novo livro"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Livro</FormLabel>
                  <FormControl>
                    <Input {...field} autoFocus={false} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL do Livro</FormLabel>
                  <FormControl>
                    <Input {...field} autoFocus={false} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="author"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Autor</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gênero</FormLabel>
                  <FormControl>
                    <SelectField
                      value={field.value ?? undefined}
                      onChange={field.onChange}
                      items={genders}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="pages"
              render={({ field }) => {
                // Garante que o valor nunca seja undefined/null
                const value =
                  field.value === undefined || field.value === null
                    ? 0
                    : field.value;

                return (
                  <FormItem>
                    <FormLabel>Número de páginas</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        value={value}
                        onChange={(e) => {
                          const numValue = parseInt(e.target.value);
                          field.onChange(isNaN(numValue) ? 0 : numValue);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={control}
              name="chosen_by"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quem escolheu?</FormLabel>
                  <FormControl>
                    <SelectField
                      value={field.value}
                      onChange={field.onChange}
                      items={[
                        { label: "Matheus", value: "Matheus" },
                        { label: "Fabi", value: "Fabi" },
                        { label: "Barbara", value: "Barbara" },
                      ]}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="readers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quem vai ler o livro?</FormLabel>
                  <FormControl>
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
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Status da leitura</FormLabel>
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
                    <FormLabel htmlFor={id}>{label}</FormLabel>
                  </div>
                ))}
              </div>
            </FormItem>

            {selected !== "not_started" && selected !== null && (
              <>
                <FormField
                  control={control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início da Leitura</FormLabel>
                      <FormControl>
                        <DatePicker
                          isAfterTodayHidden
                          title="Data de Início da Leitura"
                          value={
                            field.value ? new Date(field.value) : undefined
                          }
                          onChange={(date) =>
                            field.onChange(date?.toISOString() ?? null)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selected === "finished" && (
                  <FormField
                    control={control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Término da Leitura</FormLabel>
                        <FormControl>
                          <DatePicker
                            isAfterTodayHidden
                            title="Data de Término da Leitura"
                            value={
                              field.value ? new Date(field.value) : undefined
                            }
                            onChange={(date) =>
                              field.onChange(date?.toISOString() ?? null)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit" isLoading={isLoading}>
                {bookData ? "Editar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
