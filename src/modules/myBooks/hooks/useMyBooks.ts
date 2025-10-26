import { BookService } from "@/services/books/books.service";
import { useQuery } from "@tanstack/react-query";
import { useUserStore } from "@/stores/userStore";
import { useMemo } from "react";
import { FiltersOptions } from "@/types/filters";
import { useFiltersUrl } from "@/hooks/useFiltersUrl";
import {
  formatGenres,
  formatReaders,
  formatStatus,
} from "@/utils/formatters/formatters";

export function useMyBooks() {
  const fetchUser = useUserStore((state) => state.fetchUser);
  const bookService = new BookService();
  const { user } = useUserStore();

  const defaultFactory = useMemo(
    () => () =>
      ({
        readers: [],
        status: [],
        gender: [],
        userId: "",
        bookId: "",
      } as FiltersOptions),
    []
  );

  const {
    filters,
    searchQuery,
    hasSearchParams,
    inputRef,
    updateUrlWithFilters,
    handleOnPressEnter,
    handleClearAllFilters,
    handleInputBlur,
    handleSearchButtonClick,
  } = useFiltersUrl(defaultFactory);

  const {
    data: allBooks,
    isFetching: isLoadingAllBooks,
    isFetched,
    isError,
  } = useQuery({
    queryKey: ["books", filters, searchQuery, user?.id],
    queryFn: async () =>
      bookService.getAll({
        bookId: filters.bookId,
        filters,
        search: searchQuery,
        userId: user?.id,
      }),
  });

  // REMOVER
  const { isLoading: isLoadingUser, isError: isErrorUser } = useQuery({
    queryKey: ["user"],
    queryFn: () =>
      fetchUser().then(() => {
        const user = useUserStore.getState().user;
        const error = useUserStore.getState().error;
        if (error) throw new Error(error);
        return user;
      }),
  });

  const formattedGenres = formatGenres(filters.gender);
  const formattedReaders = formatReaders(filters.readers);
  const formattedStatus = formatStatus(filters.status);

  return {
    allBooks,
    isLoadingAllBooks: isLoadingAllBooks,
    isFetched,
    isError,
    isLoadingUser,
    isErrorUser,
    searchQuery,
    updateUrlWithFilters,
    formattedStatus,
    formattedReaders,
    formattedGenres,
    handleSearchButtonClick,
    handleInputBlur,
    inputRef,
    handleOnPressEnter,
    handleClearAllFilters,
    filters,
    hasSearchParams,
  };
}
