import { BookService } from "@/services/books/books.service";
import { useQuery } from "@tanstack/react-query";
import { useUserStore } from "@/stores/userStore";
import { SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import { useFiltersUrl } from "@/hooks/useFiltersUrl";
import {
  formatGenres,
  formatReaders,
  formatStatus,
  formatYear,
} from "@/utils/formatters/formatters";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { INITIAL_FILTERS, QUERY_KEYS } from "@/constants/keys";
import { useStatusFilters } from "@/hooks/useStatusFilters";

const PAGE_SIZE = 8;

export function useMyBooks() {
  const bookService = useMemo(() => new BookService(), []);
  const { user } = useUserStore();
  const isLoggedIn = useIsLoggedIn();

  const [currentPage, setCurrentPage] = useState(0);

  const defaultFactory = useCallback(() => ({ ...INITIAL_FILTERS }), []);

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
    queryKey: QUERY_KEYS.books.myBooks(
      filters,
      searchQuery,
      user?.id,
      currentPage,
    ),
    queryFn: async () => {
      const response = await bookService.getAll({
        bookId: filters.bookId,
        filters,
        search: searchQuery,
        userId: user?.id,
        page: currentPage,
        pageSize: PAGE_SIZE,
      });

      const isAwaitingSpecificBook = !!(filters.bookId || searchQuery);

      if (
        isLoggedIn &&
        isAwaitingSpecificBook &&
        (!response || response.data?.length === 0)
      ) {
        throw new Error("Sincronizando seus livros...");
      }

      return response;
    },
    retry: (failureCount) => {
      const isAwaitingSpecificBook = !!(filters.bookId || searchQuery);
      return isLoggedIn && isAwaitingSpecificBook && failureCount < 2;
    },
    retryDelay: 1000,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const formattedGenres = useMemo(
    () => formatGenres(filters.gender),
    [filters.gender],
  );
  const formattedReaders = useMemo(
    () => formatReaders(filters.readers),
    [filters.readers],
  );
  const formattedStatus = useMemo(
    () => formatStatus(filters.status),
    [filters.status],
  );
  const formattedYear = useMemo(
    () => formatYear(filters.year),
    [filters.year],
  );

  const totalPages = useMemo(
    () => Math.ceil((allBooks?.total || 0) / PAGE_SIZE),
    [allBooks?.total],
  );

  const handlePageChange = useCallback((page: SetStateAction<number>) => {
    setCurrentPage(page);
  }, []);

  const handleSetYear = useCallback(
    (year: number | undefined) => {
      updateUrlWithFilters({ ...filters, year });
    },
    [filters, updateUrlWithFilters],
  );

  const canClear = useMemo(
    () =>
      (!!searchQuery && hasSearchParams) ||
      filters.gender?.length > 0 ||
      (filters.readers?.length > 0 && hasSearchParams) ||
      filters.status?.length > 0 ||
      !!filters.year,
    [searchQuery, hasSearchParams, filters],
  );

  const activeFilterLabels = useMemo(() => {
    const labels: string[] = [];
    if (searchQuery) labels.push(`"${searchQuery}"`);
    if (formattedGenres) labels.push(formattedGenres);
    if (formattedReaders) labels.push(`Leitores: ${formattedReaders}`);
    if (formattedStatus) labels.push(formattedStatus);
    if (formattedYear) labels.push(`Ano: ${formattedYear}`);
    return labels;
  }, [searchQuery, formattedGenres, formattedReaders, formattedStatus, formattedYear]);

  const { activeStatuses, handleToggleStatus } = useStatusFilters({
    filters,
    searchQuery,
    updateUrlWithFilters,
  });

  return {
    allBooks,
    isLoadingAllBooks,
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
    setCurrentPage: handlePageChange,
    totalPages,
    activeStatuses,
    handleToggleStatus,
    handleSetYear,
    canClear,
    activeFilterLabels,
  };
}
