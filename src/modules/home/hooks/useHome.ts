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
} from "@/utils/formatters/formatters";
import { UserDomain } from "@/services/users/types/users.types";

const PAGE_SIZE = 8;

export function useHome() {
  const bookService = useMemo(() => new BookService(), []);
  const { users, isLoadingUsers } = useUser();
  const user = useUserStore((state) => state.user);

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

  const handleGenerateReadersObj = useCallback(() => {
    if (filters.readers.length > 0) {
      return {
        readers: filters.readers,
        readersDisplay: filters.readers,
      };
    } else {
      const allNames = users.map((u) => u.display_name);
      return {
        readers: allNames,
        readersDisplay: allNames.join(", "),
      };
    }
  }, [filters.readers, users]);

  const {
    data: allBooks,
    isFetching: isLoadingAllBooks,
    isFetched,
    isError,
  } = useQuery({
    queryKey: ["books", filters, searchQuery, currentPage],
    queryFn: () =>
      bookService.getAll({
        bookId: filters.bookId,
        authorId: filters.authorId,
        filters: {
          readers: handleGenerateReadersObj().readers,
          status: filters.status,
          gender: filters.gender,
        },
        search: searchQuery,
        userId: undefined,
        page: currentPage,
        pageSize: PAGE_SIZE,
      }),
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

  const isLoadingData = isLoadingUsers || isLoadingAllBooks;

  return {
    allBooks,
    isLoadingAllBooks: isLoadingData,
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
    handleGenerateReadersObj,
    user,
    currentPage,
    setCurrentPage,
  };
}
