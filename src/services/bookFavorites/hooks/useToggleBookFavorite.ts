import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { QUERY_KEYS } from "@/constants/keys";
import { BookFavoritesService } from "@/services/bookFavorites/bookFavorites.service";
import { useUserStore } from "@/stores/userStore";

const service = new BookFavoritesService();

export function useToggleBookFavorite() {
  const queryClient = useQueryClient();
  const userId = useUserStore((s) => s.user?.id);

  const mutation = useMutation({
    mutationFn: async ({
      bookId,
      next,
    }: {
      bookId: string;
      next: boolean;
    }) => {
      if (next) {
        await service.add(bookId);
      } else {
        await service.remove(bookId);
      }
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.bookFavorites.byUser(userId),
        });
      }
    },
  });

  const toggle = useCallback(
    (bookId: string, nextFollowing: boolean) => {
      mutation.mutate({ bookId, next: nextFollowing });
    },
    [mutation],
  );

  return {
    toggle,
    isPending: mutation.isPending,
  };
}
