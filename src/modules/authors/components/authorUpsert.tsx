import React from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthorsService } from "../services/authors.service";

interface AuthorUpsertProps {
  isOpen: boolean;
  mode: "create" | "edit";
  authorId?: string;
  defaultName?: string;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (authorId: string) => void;
}

export default function AuthorUpsert({
  isOpen,
  onOpenChange,
  defaultName = "",
  authorId,
  onSuccess,
  mode = "create",
}: AuthorUpsertProps) {
  const queryClient = useQueryClient();
  const authorsService = React.useMemo(() => new AuthorsService(), []);

  const form = useForm({
    defaultValues: {
      name: defaultName,
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({ name: defaultName });
    }
  }, [isOpen, defaultName, form]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: { name: string }) => {
      if (mode === "create") {
        return authorsService.createAuthor(data.name);
      }

      if (!authorId) throw new Error("Author id is required for edit");

      return authorsService.editAuthor(data.name, authorId);
    },
    onSuccess: (author: { id: string }) => {
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      onSuccess?.(author.id);
      onOpenChange(false);
      form.reset();
    },
  });

  const onSubmit = (data: { name: string }) => {
    mutate(data);
  };

  const isEdit = mode === "edit";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar Autor" : "Cadastrar Novo Autor"}
          </DialogTitle>
        </DialogHeader>

        <Separator className="my-2" />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              rules={{ required: "O nome do autor é obrigatório" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Autor</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Stephen King" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>

              <Button type="submit" isLoading={isPending}>
                {isEdit ? "Salvar Alterações" : "Salvar Autor"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
