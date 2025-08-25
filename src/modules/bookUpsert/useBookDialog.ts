import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookCreateValidator, Status } from "@/types/books.types";
import { UseFormReset } from "react-hook-form";
import { BookUpsertService } from "./services/bookUpsert.service";
import { toast } from "sonner";
import { BookshelfService } from "../shelves/services/booksshelves.service";
import { useCallback, useState } from "react";
import { BookQueryBuilder } from "@/lib/builders/bookQuery.builder";
import { createClient } from "@/lib/supabase/client";

type UseCreateBookDialog = {
  reset: UseFormReset<BookCreateValidator>;
  bookData: BookCreateValidator | undefined;
  isEdit: boolean;
  setIsBookFormOpen: (open: boolean) => void;
};

export function useBookDialog({
  reset,
  bookData,
  setIsBookFormOpen,
  isEdit,
}: UseCreateBookDialog) {
  const queryClient = useQueryClient();

  const [selected, setSelected] = useState<Status | null>(null);
  const [isAddToShelfEnabled, setIsAddToShelfEnabled] = useState(false);
  const [selectedShelfId, setSelectedShelfId] = useState("");
  const [isDuplicateBookDialogOpen, setIsDuplicateBookDialogOpen] = useState<boolean>(false);

  const handleResetForm = useCallback(() => {
    setIsBookFormOpen(false);
    reset();
    setSelected(null);
    setIsAddToShelfEnabled(false);
    setSelectedShelfId("");
  }, [setIsBookFormOpen, reset]);

  const checkDuplicateBook = async (title: string): Promise<boolean> => {
    const supabase = createClient();
    const duplicateCheckQuery = await new BookQueryBuilder(supabase)
      .withSearchTerm(title)
      .build();

    const { data: booksWithSameTitle } = await duplicateCheckQuery;

    return booksWithSameTitle?.length > 0;
  };

  const createBook = useMutation({
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
      handleResetForm();
      setIsDuplicateBookDialogOpen(false);

      toast("Livro salvo com sucesso!", {
        description: bookData ? "Edição concluída" : "Novo livro adicionado",
        className: "toast-success text-white",
      });

      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
    onError: (error) => {
      if (error instanceof Error) {
        if (error.message === "Falha ao adicionar livro á estante") {
          handleResetForm();

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

  const onSubmit = async (data: BookCreateValidator) => {
    const isDuplicate = await checkDuplicateBook(data.title);
    if (isDuplicate) {
      setIsDuplicateBookDialogOpen(true);
      setIsBookFormOpen(false);
      return;
    }
    return createBook.mutate(data);
  }

  return {
    onSubmit,
    createBook,           
    isLoading: createBook.isPending,
    isSuccess: createBook.isSuccess,
    isError: createBook.isError,
    error: createBook.error,

    selected,
    setSelected,

    isAddToShelfEnabled,
    setIsAddToShelfEnabled,

    selectedShelfId,
    setSelectedShelfId,

    isDuplicateBookDialogOpen,
    setIsDuplicateBookDialogOpen,
  };
}
