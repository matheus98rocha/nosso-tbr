// hooks/useDesktopNav.ts
import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUserStore } from "@/stores/userStore";
import { BookService } from "@/services/books/books.service";
import { AuthorsService } from "@/modules/authors/services/authors.service";
import { StatsService } from "@/modules/stats/services/stats.service";
import { fetchBookShelves } from "@/modules/shelves/services/booksshelves.service";
import { INITIAL_FILTERS, QUERY_KEYS } from "@/constants/keys";

export function useDesktopNav() {
  const queryClient = useQueryClient();
  const { user } = useUserStore();

  const services = useMemo(
    () => ({
      book: new BookService(),
      authors: new AuthorsService(),
      stats: new StatsService(),
    }),
    [],
  );
  const handlePrefetch = useCallback(
    async (label: string) => {
      const commonOptions = { staleTime: 1000 * 60 * 5 };
      const reader = user?.id || "Matheus";

      const prefetchMap: Record<string, () => Promise<void>> = {
        "Meus Livros": async () => {
          if (!user?.id) return;

          await queryClient.prefetchQuery({
            queryKey: QUERY_KEYS.books.myBooks(INITIAL_FILTERS, "", user.id, 0),
            queryFn: () =>
              services.book.getAll({
                userId: user.id,
                page: 0,
                pageSize: 8,
                filters: INITIAL_FILTERS,
              }),
            staleTime: 1000 * 60 * 5,
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
              services.authors.getAuthors({
                withCountBooks: true,
                page: 0,
                pageSize: 8,
                searchName: "",
              }),
            ...commonOptions,
          }),
        Estatisticas: async () => {
          await Promise.all([
            queryClient.prefetchQuery({
              queryKey: QUERY_KEYS.stats.byReader(reader),
              queryFn: () => services.stats.getByReader(reader),
              ...commonOptions,
            }),
            queryClient.prefetchQuery({
              queryKey: QUERY_KEYS.stats.collaboration(reader),
              queryFn: () => services.stats.getCollaborationStats(reader),
              ...commonOptions,
            }),
          ]);
        },
      };

      if (prefetchMap[label]) await prefetchMap[label]();
    },
    [queryClient, user, services],
  );

  return { handlePrefetch };
}
