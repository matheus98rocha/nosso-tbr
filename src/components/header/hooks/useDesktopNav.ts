import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUserStore } from "@/stores/userStore";
import { BookService } from "@/services/books/books.service";
import { AuthorsService } from "@/modules/authors/services/authors.service";
import { StatsService } from "@/modules/stats/services/stats.service";
import { fetchBookShelves } from "@/modules/shelves/services/booksshelves.service";
import { INITIAL_FILTERS, QUERY_KEYS } from "@/constants/keys";

const bookService = new BookService();
const authorsService = new AuthorsService();
const statsService = new StatsService();

export function useDesktopNav() {
  const queryClient = useQueryClient();
  const { user } = useUserStore();

  const handlePrefetch = useCallback(
    async (label: string) => {
      const STALE_TIME = 1000 * 60 * 5;
      const commonOptions = { staleTime: STALE_TIME };

      const prefetchMap: Record<string, () => Promise<void>> = {
        "Meus Livros": async () => {
          if (!user?.id) return;
          await queryClient.prefetchQuery({
            queryKey: QUERY_KEYS.books.myBooks(INITIAL_FILTERS, "", user.id, 0),
            queryFn: () =>
              bookService.getAll({
                userId: user.id,
                page: 0,
                pageSize: 8,
                filters: INITIAL_FILTERS,
              }),
            ...commonOptions,
          });
        },
        "Ver Estantes": () =>
          queryClient.prefetchQuery({
            queryKey: QUERY_KEYS.shelves.all,
            queryFn: fetchBookShelves,
            ...commonOptions,
          }),
        Autores: () =>
          queryClient.prefetchQuery({
            queryKey: QUERY_KEYS.authors.list(0, ""),
            queryFn: () =>
              authorsService.getAuthors({
                withCountBooks: true,
                page: 0,
                pageSize: 8,
                searchName: "",
              }),
            ...commonOptions,
          }),
        Estatisticas: async () => {
          if (!user?.id) return;
          const statsRequests = [
            queryClient.prefetchQuery({
              queryKey: QUERY_KEYS.stats.byReader(user.id),
              queryFn: () => statsService.getByReader(user.id),
              ...commonOptions,
            }),
            queryClient.prefetchQuery({
              queryKey: QUERY_KEYS.stats.collaboration(user.id),
              queryFn: () => statsService.getCollaborationStats(user.id),
              ...commonOptions,
            }),
          ];
          await Promise.allSettled(statsRequests);
        },
      };

      const action = prefetchMap[label];

      if (action) {
        await action();
      }
    },
    [queryClient, user?.id],
  );

  return { handlePrefetch };
}
