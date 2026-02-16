import { BookService } from "@/services/books/books.service";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/services/users/hooks/useUsers";
import { useUserStore } from "@/stores/userStore";
import { useCallback, useMemo } from "react";
import { FiltersOptions } from "@/types/filters";
import { useFiltersUrl } from "@/hooks/useFiltersUrl";
import {
  formatGenres,
  formatReaders,
  formatStatus,
} from "@/utils/formatters/formatters";
import { UserDomain } from "@/services/users/types/users.types";

export function useHome() {
  const bookService = new BookService();
  const { users, isLoadingUsers } = useUser();
  const user = useUserStore((state) => state.user);

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

  const handleGenerateReadersObj = useCallback(() => {
    if (filters.readers.length > 0) {
      return {
        readers: filters.readers,
        readersDisplay: filters.readers.map((reader) => reader),
      };
    } else {
      return {
        readers: users.map((u) => u.display_name),
        readersDisplay: users.map((u) => u.display_name).join(", "),
      };
    }
  }, [filters.readers, users]);

  const {
    data: allBooks,
    isFetching: isLoadingAllBooks,
    isFetched,
    isError,
  } = useQuery({
    queryKey: ["books", filters, searchQuery],
    queryFn: async () =>
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
      }),
  });

  console.log("Filtros atuais da URL:", filters);

  const formattedGenres = formatGenres(filters.gender);
  const formattedReaders = formatReaders(filters.readers);
  const formattedStatus = formatStatus(filters.status);

  const isLoadingData = isLoadingUsers || isLoadingAllBooks;
  const isMyBooksPage = !!filters.userId;

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
    isMyBooksPage,
    handleGenerateReadersObj,
    user,
  };
}
