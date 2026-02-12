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
import { BookUpsertService } from "../services/bookUpsert.service";

interface AuthorUpsertProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName?: string;
  onSuccess?: (authorId: string) => void;
}

export default function AuthorUpsert({
  isOpen,
  onOpenChange,
  defaultName = "",
  onSuccess,
}: AuthorUpsertProps) {
  const queryClient = useQueryClient();
  const bookUpsertService = React.useMemo(() => new BookUpsertService(), []);

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
    mutationFn: (name: string) => bookUpsertService.createAuthor(name),
    onSuccess: (newAuthor) => {
      queryClient.invalidateQueries({ queryKey: ["authors"] });
      onSuccess?.(newAuthor.id);
      onOpenChange(false);
      form.reset();
    },
  });

  const onSubmit = (data: { name: string }) => {
    mutate(data.name);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Autor</DialogTitle>
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
                Salvar Autor
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
