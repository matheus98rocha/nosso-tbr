import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookCreateValidator } from "@/types/books.types";
import { useState } from "react";
import { UseFormReset } from "react-hook-form";
import { BookService } from "@/services/books.services";

type UseCreateBookDialog = {
  reset: UseFormReset<BookCreateValidator>;
  bookData: BookCreateValidator | undefined;
};

export function useBookDialog({ reset, bookData }: UseCreateBookDialog) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: BookCreateValidator) => {
      const service = new BookService();
      if (bookData && bookData.id) {
        await service.edit(bookData.id, data);
      } else {
        await service.create(data);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      setOpen(false);
      reset();
    },
  });

  const onSubmit = (data: BookCreateValidator) => {
    mutation.mutate(data);
    // console.log(data);
  };

  return {
    onSubmit,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    open,
    setOpen,
  };
}
