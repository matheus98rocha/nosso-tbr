import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import type { MouseEvent } from "react";
import { toast } from "sonner";

import { BookUpsertService } from "@/modules/bookUpsert/services/bookUpsert.service";
import { useUserStore } from "@/stores/userStore";

import { buildAddToLibraryPayload } from "../services/buildAddToLibraryPayload";
import type { UseAddBookToLibraryParams } from "./useAddBookToLibrary.types";

export function useAddBookToLibrary({
  book,
  enabled,
}: UseAddBookToLibraryParams) {
  const queryClient = useQueryClient();
  const userId = useUserStore((state) => state.user?.id);
  const bookUpsertService = useMemo(() => new BookUpsertService(), []);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error("É preciso estar autenticado para adicionar o livro.");
      }
      if (!book.authorId) {
        throw new Error("Este livro não tem autor para ser copiado.");
      }

      const match = await bookUpsertService.findCatalogBookMatch({
        title: book.title,
        authorId: book.authorId,
        currentUserId: userId,
      });

      if (match?.userAlreadyLinked) {
        throw new Error("Este livro já está na sua biblioteca.");
      }

      return bookUpsertService.create(buildAddToLibraryPayload(book, userId));
    },
    onSuccess: async () => {
      toast("Livro adicionado à sua biblioteca!");
      await queryClient.invalidateQueries({ queryKey: ["books"], exact: false });
    },
    onError: (error) => {
      toast("Não foi possível adicionar o livro", {
        description: error instanceof Error ? error.message : "Tente novamente.",
        className: "toast-error",
      });
    },
  });

  const addToLibrary = useCallback(
    (event?: MouseEvent<HTMLButtonElement>) => {
      event?.preventDefault();
      event?.stopPropagation();
      if (!enabled || mutation.isPending) return;
      mutation.mutate();
    },
    [enabled, mutation],
  );

  return {
    addToLibrary,
    isAddToLibraryPending: mutation.isPending,
  };
}
