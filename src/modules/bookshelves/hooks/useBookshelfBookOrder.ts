import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/clientJsonFetch";
import type { BookDomain } from "@/types/books.types";
import { bookshelfBooksQueryKey } from "@/modules/bookshelves/bookshelfBooksQueryKey";
import { BookshelfServiceBooks } from "@/modules/bookshelves/services/bookshelvesBooks.service";
import {
  reorderBooksByIdOrder,
  validateShelfReorderPayload,
} from "@/modules/bookshelves/utils/shelfBookOrder";

export function useBookshelfBookOrder(shelfId: string | undefined) {
  const queryClient = useQueryClient();
  const service = useMemo(() => new BookshelfServiceBooks(), []);

  const mutation = useMutation({
    mutationFn: useCallback(
      async ({ bookIds }: { bookIds: string[] }) => {
        if (!shelfId) throw new Error("Estante inválida");
        await service.reorderBooksOnShelf(shelfId, bookIds);
      },
      [service, shelfId],
    ),
    onMutate: async ({ bookIds }) => {
      if (!shelfId) return { previous: undefined };
      await queryClient.cancelQueries({
        queryKey: bookshelfBooksQueryKey(shelfId),
      });
      const previous = queryClient.getQueryData<BookDomain[]>(
        bookshelfBooksQueryKey(shelfId),
      );
      if (previous) {
        queryClient.setQueryData(
          bookshelfBooksQueryKey(shelfId),
          reorderBooksByIdOrder(previous, bookIds),
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (shelfId && context?.previous) {
        queryClient.setQueryData(
          bookshelfBooksQueryKey(shelfId),
          context.previous,
        );
      }
      const msg =
        _err instanceof ApiError
          ? _err.message
          : "Não foi possível salvar a ordem dos livros.";
      toast.error(msg);
    },
    onSettled: () => {
      if (shelfId) {
        queryClient.invalidateQueries({
          queryKey: bookshelfBooksQueryKey(shelfId),
        });
      }
    },
  });

  const applyReorder = useCallback(
    (books: readonly BookDomain[], nextOrderedIds: string[]) => {
      try {
        const currentIds = books
          .map((b) => b.id)
          .filter((id): id is string => Boolean(id));
        validateShelfReorderPayload(currentIds, nextOrderedIds);
        mutation.mutate({ bookIds: nextOrderedIds });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Ordem inválida.";
        toast.error(msg);
      }
    },
    [mutation],
  );

  return { applyReorder, isPending: mutation.isPending };
}
