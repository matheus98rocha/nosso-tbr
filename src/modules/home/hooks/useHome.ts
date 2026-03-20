import { BookService } from "@/services/books/books.service";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/services/users/hooks/useUsers";
import { useUserStore } from "@/stores/userStore";
import { useCallback, useMemo, useState, useEffect } from "react";
import { FiltersOptions } from "@/types/filters";
import { useFiltersUrl } from "@/hooks/useFiltersUrl";
import {
  formatGenres,
  formatReaders,
  formatStatus,
  formatYear,
} from "@/utils/formatters/formatters";
import { UserDomain } from "@/services/users/types/users.types";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { QUERY_KEYS } from "@/constants/keys";
import { useStatusFilters } from "@/hooks/useStatusFilters";

const PAGE_SIZE = 8;
const bookService = new BookService();

export function useHome() {
  const { users, isLoadingUsers } = useUser();
  const user = useUserStore((state) => state.user);
  const isLoggedIn = useIsLoggedIn();

  const [currentPage, setCurrentPage] = useState(0);

  const defaultFactory = useMemo(
    () => () =>
      ({
        readers: users.map((u: UserDomain) => u.display_name),
        status: [],
        gender: [],
        userId: "",
        bookId: "",
        authorId: "",
        year: undefined,
        myBooks: false,
      }) as FiltersOptions,
    [users],
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

  const isMyBooksActive = !!(filters.myBooks && isLoggedIn && user?.id);

  const readersObj = useMemo(() => {
    if (isMyBooksActive) {
      return { readers: [], readersDisplay: "" };
    }
    if (filters.readers.length > 0) {
      return {
        readers: filters.readers,
        readersDisplay: filters.readers.join(", "),
      };
    }
    const allNames = users.map((u) => u.display_name);
    return {
      readers: allNames,
      readersDisplay: allNames.join(", "),
    };
  }, [filters.readers, users, isMyBooksActive]);

  const isAwaitingSpecificBook = useMemo(
    () => !!(filters.bookId || searchQuery),
    [filters.bookId, searchQuery],
  );

  const effectiveUserId = isMyBooksActive ? user!.id : undefined;

  const {
    data: allBooks,
    isFetching: isLoadingAllBooks,
    isFetched,
    isError,
  } = useQuery({
    queryKey: QUERY_KEYS.books.list(
      filters,
      searchQuery,
      currentPage,
      effectiveUserId,
    ),
    queryFn: async () => {
      const response = await bookService.getAll({
        bookId: filters.bookId,
        search: searchQuery,
        userId: effectiveUserId,
        filters: {
          readers: isMyBooksActive ? [] : readersObj.readers,
          status: filters.status,
          gender: filters.gender,
          year: filters.year,
        },
        page: currentPage,
        pageSize: PAGE_SIZE,
      });

      if (
        isLoggedIn &&
        isAwaitingSpecificBook &&
        (!response || response.data?.length === 0)
      ) {
        throw new Error("Sincronizando novo livro...");
      }

      return response;
    },
    retry: (failureCount) => {
      if (isLoggedIn && isAwaitingSpecificBook && failureCount < 2) {
        return true;
      }
      return false;
    },
    retryDelay: 1000,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: false,
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

  const canClear = useMemo(
    () =>
      (!!searchQuery && hasSearchParams) ||
      filters.gender?.length > 0 ||
      (filters.readers?.length > 0 && hasSearchParams) ||
      filters.status?.length > 0 ||
      !!filters.year ||
      !!filters.myBooks,
    [searchQuery, hasSearchParams, filters],
  );

  const activeFilterLabels = useMemo(() => {
    const labels: string[] = [];
    if (filters.myBooks) labels.push("Meus Livros");
    if (searchQuery) labels.push(`"${searchQuery}"`);
    if (formattedGenres) labels.push(formattedGenres);
    if (!isMyBooksActive && formattedReaders)
      labels.push(`Leitores: ${readersObj.readersDisplay}`);
    if (formattedStatus) labels.push(formattedStatus);
    if (formattedYear) labels.push(`Ano: ${formattedYear}`);
    return labels;
  }, [
    searchQuery,
    formattedGenres,
    formattedReaders,
    formattedStatus,
    formattedYear,
    readersObj.readersDisplay,
    filters.myBooks,
    isMyBooksActive,
  ]);

  const handleSetYear = useCallback(
    (year: number | undefined) => {
      updateUrlWithFilters({ ...filters, year });
    },
    [filters, updateUrlWithFilters],
  );

  const handleToggleMyBooks = useCallback(() => {
    updateUrlWithFilters({ ...filters, myBooks: !filters.myBooks });
  }, [filters, updateUrlWithFilters]);

  const handleSetJointReading = useCallback(() => {
    updateUrlWithFilters({ ...filters, myBooks: false });
  }, [filters, updateUrlWithFilters]);

  const { activeStatuses, handleToggleStatus } = useStatusFilters({
    filters,
    searchQuery,
    updateUrlWithFilters,
  });

  const isLoadingData = isLoadingUsers || isLoadingAllBooks;

  const totalPages = Math.ceil((allBooks?.total || 0) / PAGE_SIZE);

  return {
    allBooks,
    isLoadingAllBooks: isLoadingData,
    totalPages,
    isFetched,
    isError,
    searchQuery,
    updateUrlWithFilters,
    formattedStatus,
    formattedReaders,
    formattedGenres,
    formattedYear,
    handleSearchButtonClick,
    handleInputBlur,
    inputRef,
    handleOnPressEnter,
    handleClearAllFilters,
    filters,
    hasSearchParams,
    readersObj,
    user,
    currentPage,
    setCurrentPage,
    activeStatuses,
    handleToggleStatus,
    handleSetYear,
    canClear,
    activeFilterLabels,
    handleToggleMyBooks,
    handleSetJointReading,
    isMyBooksActive,
    isLoggedIn,
  };
}
