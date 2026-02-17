import { BookService } from "@/services/books/books.service";
import { useQuery } from "@tanstack/react-query";
import { useUserStore } from "@/stores/userStore";
import { useEffect, useMemo, useState } from "react";
import { FiltersOptions } from "@/types/filters";
import { useFiltersUrl } from "@/hooks/useFiltersUrl";
import {
  formatGenres,
  formatReaders,
  formatStatus,
} from "@/utils/formatters/formatters";

export function useMyBooks() {
  const PAGE_SIZE = 8;

  const bookService = new BookService();
  const { user } = useUserStore();

  const [currentPage, setCurrentPage] = useState(0);

  const defaultFactory = useMemo(
    () => () =>
      ({
        readers: [],
        status: [],
        gender: [],
        userId: "",
        bookId: "",
      }) as FiltersOptions,
    [],
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

  useEffect(() => {
    setCurrentPage(0);
  }, [filters, searchQuery]);

  const {
    data: allBooks,
    isFetching: isLoadingAllBooks,
    isFetched,
    isError,
  } = useQuery({
    queryKey: ["books", filters, searchQuery, user?.id, currentPage],
    queryFn: async () =>
      bookService.getAll({
        bookId: filters.bookId,
        filters,
        search: searchQuery,
        userId: user?.id,
        page: currentPage,
        pageSize: PAGE_SIZE,
      }),
  });

  const formattedGenres = formatGenres(filters.gender);
  const formattedReaders = formatReaders(filters.readers);
  const formattedStatus = formatStatus(filters.status);

  const totalPages = useMemo(
    () => Math.ceil((allBooks?.total || 0) / PAGE_SIZE),
    [allBooks?.total],
  );

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
    currentPage,
    setCurrentPage,
    totalPages,
  };
}
