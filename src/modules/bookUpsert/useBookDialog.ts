import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookCreateValidator } from "@/types/books.types";
import { UseFormReset } from "react-hook-form";
import { BookUpsertService } from "./services/bookUpsert.service";
import { toast } from "sonner";
import { BookshelfService } from "../shelves/services/booksshelves.service";

type UseCreateBookDialog = {
  reset: UseFormReset<BookCreateValidator>;
  bookData: BookCreateValidator | undefined;
  isEdit: boolean;
  onOpenChange: (open: boolean) => void;
  isAddToShelfEnabled: boolean;
  selectedShelfId: string;
};

export function useBookDialog({
  reset,
  bookData,
  onOpenChange,
  isEdit,
  isAddToShelfEnabled,
  selectedShelfId,
}: UseCreateBookDialog) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: BookCreateValidator) => {
      const service = new BookUpsertService();

      if (isEdit) {
        if (!bookData || !bookData.id) {
          throw new Error("Erro inesperado.");
        }
        await service.edit(bookData.id, data);
      } else {
        const createdBook = await service.create(data);

        if (isAddToShelfEnabled) {
          if (!createdBook?.id) {
            throw new Error("Algo deu errado ao adicionar o livro à estante.");
          }

          const bookshelfService = new BookshelfService();
          await bookshelfService.addBookToShelf(
            selectedShelfId,
            createdBook.id
          );
        }
      }
    },
    onSuccess: () => {
      onOpenChange(false);
      reset();

      toast("Livro salvo com sucesso!", {
        description: bookData ? "Edição concluída" : "Novo livro adicionado",
        className: "toast-success",
      });

      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
    onError: (error) => {
      if (error instanceof Error) {
        if (error.message === "Falha ao adicionar livro á estante") {
          onOpenChange(false);
          reset();

          toast(
            "O livro foi criado, porém houve um erro ao adicionar o livro a estante...",
            {
              description: error.message || "Ocorreu um erro inesperado.",
              className: "toast-error",
            }
          );

          queryClient.invalidateQueries({ queryKey: ["books"] });
        } else {
          toast("Erro ao salvar livro", {
            description: error.message || "Ocorreu um erro inesperado.",
            className: "toast-error",
          });
        }
      }
    },
  });

  const onSubmit = (data: BookCreateValidator) => {
    mutation.mutate(data);
  };

  return {
    onSubmit,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
  };
}
