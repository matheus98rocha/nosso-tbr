import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookService } from "@/services/books.services";
import { BookCreateValidator } from "@/types/books.types";
import { useState } from "react";
import { UseFormReset } from "react-hook-form";

type UseCreateBookDialog = {
  reset: UseFormReset<BookCreateValidator>;
};

export function useCreateBookDialog({ reset }: UseCreateBookDialog) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: BookCreateValidator) => {
      const service = new BookService();
      await service.create(data);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      setOpen(false);
      reset();
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
    open,
    setOpen,
  };
}
