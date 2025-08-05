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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  bookshelfCreateSchema,
  BookshelfCreateValidator,
} from "../../validators/bookshelves.validator";
import { useBookshelves } from "../../hooks/useBookshelves";
import { BookshelfDomain } from "../../types/bookshelves.types";
import { useEffect } from "react";
import { SelectField } from "@/modules/home/components/select/select.";
import { usePathname, useRouter } from "next/navigation";

type BookshelfDialogProps = {
  isOpen: boolean;
  handleClose: (open: boolean) => void;
  editShelf?: BookshelfDomain;
};

export function CreateEditBookshelves({
  isOpen,
  handleClose,
  editShelf,
}: BookshelfDialogProps) {
  const pathname = usePathname();
  const router = useRouter();

  const form = useForm<BookshelfCreateValidator>({
    resolver: zodResolver(bookshelfCreateSchema),
    defaultValues: {
      name: editShelf?.name ?? "",
      owner: editShelf?.owner ?? undefined,
      ...editShelf,
    },
  });

  const { mutate, isCreating } = useBookshelves({
    handleClose,
    editShelf,
  });

  function onSubmit(values: BookshelfCreateValidator) {
    mutate(values, {
      onSuccess: () => {
        if (pathname !== "/shelves") {
          router.push("/shelves");
        }
        form.reset();
      },
    });
  }

  useEffect(() => {
    if (!isOpen) {
      form.reset({
        name: editShelf?.name ?? "",
      });
    }
  }, [form, isOpen, editShelf]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editShelf ? "Editar Estante" : "Criar Nova Estante"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Estante</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Livros de Ficção" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="owner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dono da Estante</FormLabel>
                  <FormControl>
                    <SelectField
                      value={field.value}
                      onChange={field.onChange}
                      items={[
                        { label: "Matheus", value: "Matheus" },
                        { label: "Fabi", value: "Fabi" },
                      ]}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit" isLoading={isCreating}>
                {editShelf ? "Editar Estante" : "Criar Estante"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
