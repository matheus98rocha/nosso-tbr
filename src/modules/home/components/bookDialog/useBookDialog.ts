import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookCreateValidator } from "@/types/books.types";
import { UseFormReset } from "react-hook-form";
import { BookService } from "@/modules/home/services/books.services";

type UseCreateBookDialog = {
  reset: UseFormReset<BookCreateValidator>;
  bookData: BookCreateValidator | undefined;
  onOpenChange: (open: boolean) => void;
};

export function useBookDialog({
  reset,
  bookData,
  onOpenChange,
}: UseCreateBookDialog) {
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
      onOpenChange(false);
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
  };
}
