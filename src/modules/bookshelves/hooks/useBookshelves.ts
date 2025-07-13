import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookshelfCreateValidator } from "../validators/bookshelves.validator";
import { BookshelfService } from "../services/booksshelves.service";

export function useBookshelves({
  handleClose,
}: {
  handleClose?: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const service = new BookshelfService();

  const {
    data: bookshelves,
    isLoading: isFetching,
    isFetched,
    error,
  } = useQuery({
    queryKey: ["bookshelves"],
    queryFn: () => service.getAll(),
  });

  const { mutate, isPending: isCreating } = useMutation({
    mutationFn: async (payload: BookshelfCreateValidator) => {
      await service.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookshelves"] });
      if (handleClose) {
        handleClose(false);
      }
    },
  });

  return {
    bookshelves,
    isFetching,
    error,
    mutate,
    isCreating,
    isFetched,
  };
}
