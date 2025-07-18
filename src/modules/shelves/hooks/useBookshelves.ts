import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookshelfService } from "../services/booksshelves.service";
import {
  BookshelfCreateValidator,
  BookshelfDomain,
} from "../types/bookshelves.types";

export function useBookshelves({
  handleClose,
  shelf,
}: {
  handleClose?: (open: boolean) => void;
  shelf?: BookshelfDomain;
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
      if (shelf) {
        await service.update(shelf.id, payload);
      } else {
        await service.create(payload);
      }
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
