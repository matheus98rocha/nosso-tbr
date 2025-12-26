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

  const formattedGenres = formatGenres(filters.gender);
  const formattedReaders = formatReaders(filters.readers);
  const formattedStatus = formatStatus(filters.status);

  return {
    allBooks,
    isLoadingAllBooks: isLoadingAllBooks,
    isFetched,
    isError,
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
