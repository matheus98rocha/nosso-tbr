import { BookService } from "@/services/books/books.service";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/services/users/hooks/useUsers";
import { useUserStore } from "@/stores/userStore";
import { useMemo } from "react";
import { FiltersOptions } from "@/types/filters";
import { useFiltersUrl } from "@/hooks/useFiltersUrl";
import {
  formatGenres,
  formatReaders,
  formatStatus,
} from "@/utils/formatters/formatters";

export function useHome() {
  const bookService = new BookService();
  const { users, isLoadingUsers } = useUser();
  const fetchUser = useUserStore((state) => state.fetchUser);

  const defaultFactory = useMemo(
    () => () =>
      ({
        readers: users.map((u) => u.display_name),
        status: [],
        gender: [],
        userId: "",
        bookId: "",
      } as FiltersOptions),
    [users]
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
    queryKey: ["books", filters, searchQuery],
    queryFn: async () =>
      bookService.getAll({
        bookId: filters.bookId,
        filters,
        search: searchQuery,
        userId: undefined,
      }),
  });

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

  const isLoadingData = isLoadingUsers || isLoadingAllBooks;
  const isMyBooksPage = !!filters.userId;

  return {
    allBooks,
    isLoadingAllBooks: isLoadingData,
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
    isMyBooksPage,
  };
}
