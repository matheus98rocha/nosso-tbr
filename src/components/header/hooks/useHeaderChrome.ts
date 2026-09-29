import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { INITIAL_FILTERS, QUERY_KEYS } from "@/constants/keys";
import { BookService } from "@/services/books/books.service";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { useUserStore } from "@/stores/userStore";

export function useHeaderChrome() {
  const queryClient = useQueryClient();
  const [scrolled, setScrolled] = useState(false);
  const user = useUserStore((state) => state.user);
  const isLogged = useIsLoggedIn();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handlePrefetchHome = useCallback(() => {
    const bookService = new BookService();
    const myBooksFilters = { ...INITIAL_FILTERS, myBooks: true };
    const commonOptions = {
      staleTime: 1000 * 60 * 5,
    };

    const prefetchRequests = [
      queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.books.list(INITIAL_FILTERS, "", 0),
        queryFn: () =>
          bookService.getAll({
            page: 0,
            pageSize: 8,
            filters: INITIAL_FILTERS,
          }),
        ...commonOptions,
      }),
    ];

    if (isLogged && user?.id) {
      prefetchRequests.push(
        queryClient.prefetchQuery({
          queryKey: QUERY_KEYS.books.list(myBooksFilters, "", 0, user.id),
          queryFn: () =>
            bookService.getAll({
              page: 0,
              pageSize: 8,
              userId: user.id,
              filters: myBooksFilters,
            }),
          ...commonOptions,
        }),
      );
    }

    void Promise.allSettled(prefetchRequests);
  }, [isLogged, queryClient, user?.id]);

  return { scrolled, handlePrefetchHome };
}
