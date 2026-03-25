import { BookService } from "@/services/books/books.service";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { sortWithPriority } from "../utils";

const PAGE_SIZE = 8;
const JOINT_READINGS_FETCH_SIZE = 2000;
const bookService = new BookService();

export function useHome() {
  const queryClient = useQueryClient();
  const { users, isLoadingUsers } = useUser();
  const user = useUserStore((state) => state.user);
  const isLoggedIn = useIsLoggedIn();

  const [currentPage, setCurrentPage] = useState(0);
  const readers: UserDomain[] = useMemo(() => {
    if (isLoggedIn) {
      return sortWithPriority(
        users,
        users.find((u: UserDomain) => u.id === user?.id)?.display_name ?? "",
      );
    }
    return users.map((u: UserDomain) => u);
  }, [users, user?.id, isLoggedIn]);

  const defaultFactory = useMemo(
    () => () => {
      const currentUserName =
        readers.find((reader) => reader.id === user?.id)?.display_name ?? "";

      return {
        readers: currentUserName ? [currentUserName] : [],
        status: [],
        gender: [],
        view: "todos",
        userId: "",
        bookId: "",
        authorId: "",
        year: undefined,
        myBooks: false,
      } as FiltersOptions;
    },
    [readers, user?.id],
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

  const isAllBooksActive = filters.view !== "joint" && !filters.myBooks;
  const isMyBooksActive = !!(filters.myBooks && isLoggedIn && user?.id);

  const readersObj = useMemo(() => {
    if (isMyBooksActive) {
      return { readers: [], readersDisplay: "" };
    }

    const allNames = users.map((u) => u.display_name);
    const selectedReaders =
      filters.readers.length > 0 ? filters.readers : allNames;
    const selectedSet = new Set(selectedReaders);
    const availableSet = new Set(allNames);
    const isAllReadersSelected =
      selectedSet.size > 0 &&
      selectedSet.size === availableSet.size &&
      [...selectedSet].every((reader) => availableSet.has(reader));

    if (!isAllReadersSelected) {
      return {
        readers: selectedReaders,
        readersDisplay: selectedReaders.join(", "),
      };
    }

    return {
      readers: [],
      readersDisplay: allNames.join(", "),
    };
  }, [filters.readers, users, isMyBooksActive]);

  const isAwaitingSpecificBook = useMemo(
    () => !!(filters.bookId || searchQuery),
    [filters.bookId, searchQuery],
  );

  const currentUserDisplayName = useMemo(
    () => users.find((u) => u.id === user?.id)?.display_name,
    [users, user?.id],
  );

  const effectiveUserId = isMyBooksActive ? user!.id : undefined;
  const defaultTodosReaders = useMemo(
    () => (currentUserDisplayName ? [currentUserDisplayName] : []),
    [currentUserDisplayName],
  );

  const relationshipUserValues = useMemo(() => {
    if (!isAllBooksActive || !isLoggedIn) return undefined;

    const selectedReaderNames =
      filters.readers.length > 0 ? filters.readers : defaultTodosReaders;

    const selectedReaderIds = selectedReaderNames
      .map((readerName) => users.find((u) => u.display_name === readerName)?.id)
      .filter((value): value is string => !!value);

    const values = [...selectedReaderNames, ...selectedReaderIds];

    return values.length > 0 ? values : undefined;
  }, [
    isAllBooksActive,
    isLoggedIn,
    filters.readers,
    defaultTodosReaders,
    users,
  ]);
  const shouldWaitForUsers =
    !isMyBooksActive && filters.readers.length === 0 && isLoadingUsers;

  const serverFilters = useMemo(
    () => ({ ...filters, readers: [] as string[] }),
    [filters],
  );
  const serverPage = isMyBooksActive ? currentPage : 0;
  const serverPageSize = isMyBooksActive
    ? PAGE_SIZE
    : JOINT_READINGS_FETCH_SIZE;

  const {
    data: rawBooks,
    isFetching: isLoadingAllBooks,
    isFetched,
    isError,
  } = useQuery({
    queryKey: QUERY_KEYS.books.list(
      serverFilters,
      searchQuery,
      serverPage,
      effectiveUserId,
    ),
    queryFn: async () => {
      if (isLoggedIn) {
        const response = await bookService.getAll({
          bookId: filters.bookId,
          authorId: filters.authorId,
          search: searchQuery,
          userId: effectiveUserId,
          relationshipUserValues,
          filters: {
            readers: [],
            status: serverFilters.status,
            gender: serverFilters.gender,
            year: serverFilters.year,
            view: serverFilters.view,
          },
          page: serverPage,
          pageSize: serverPageSize,
        });

        if (
          isAwaitingSpecificBook &&
          (!response || response.data?.length === 0)
        ) {
          throw new Error("Sincronizando novo livro...");
        }

        return response;
      }
      const response = await bookService.getAll({
        bookId: filters.bookId,
        authorId: filters.authorId,
        search: searchQuery,
        userId: effectiveUserId,
        relationshipUserValues,
        filters: {
          readers: [],
          status: filters.status,
          gender: filters.gender,
          year: filters.year,
          view: filters.view,
        },
        page: serverPage,
        pageSize: serverPageSize,
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
    enabled: !shouldWaitForUsers,
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
  const formattedYear = useMemo(() => formatYear(filters.year), [filters.year]);

  const allReaders = useMemo(
    () => users.map((userData) => userData.display_name),
    [users],
  );
  const effectiveSelectedReaders = useMemo(
    () => (filters.readers.length > 0 ? filters.readers : allReaders),
    [filters.readers, allReaders],
  );

  const allBooks = useMemo(() => {
    if (!rawBooks) {
      return rawBooks;
    }

    if (isMyBooksActive || isAllBooksActive) {
      return rawBooks;
    }

    const selectedReadersSet = new Set(effectiveSelectedReaders);
    const filteredJointBooks = rawBooks.data.filter((book) => {
      const readersStr = book.readers as string;
      if (!readersStr?.includes(" e ")) {
        return false;
      }

      if (selectedReadersSet.size === 0) {
        return true;
      }

      return [...selectedReadersSet].some((reader) =>
        readersStr.includes(reader),
      );
    });

    const from = currentPage * PAGE_SIZE;
    const to = from + PAGE_SIZE;

    return {
      data: filteredJointBooks.slice(from, to),
      total: filteredJointBooks.length,
    };
  }, [
    rawBooks,
    isMyBooksActive,
    isAllBooksActive,
    effectiveSelectedReaders,
    currentPage,
  ]);

  const canClear = useMemo(
    () =>
      (!!searchQuery && hasSearchParams) ||
      filters.gender?.length > 0 ||
      (filters.readers?.length > 0 &&
        (hasSearchParams ||
          (isAllBooksActive &&
            JSON.stringify(filters.readers) !==
              JSON.stringify(defaultTodosReaders)))) ||
      filters.status?.length > 0 ||
      !!filters.year ||
      filters.view === "joint" ||
      !!filters.myBooks,
    [searchQuery, hasSearchParams, filters, isAllBooksActive, defaultTodosReaders],
  );

  const activeFilterLabels = useMemo(() => {
    const labels: string[] = [];
    if (filters.myBooks) labels.push("Meus Livros");
    if (searchQuery) labels.push(`"${searchQuery}"`);
    if (formattedGenres) labels.push(formattedGenres);
    if (!isMyBooksActive && !isAllBooksActive && formattedReaders)
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
    isAllBooksActive,
  ]);

  const handleSetYear = useCallback(
    (year: number | undefined) => {
      updateUrlWithFilters({ ...filters, year });
    },
    [filters, updateUrlWithFilters],
  );

  const handleToggleMyBooks = useCallback(() => {
    const nextMyBooks = !filters.myBooks;
    updateUrlWithFilters({
      ...filters,
      myBooks: nextMyBooks,
      view: nextMyBooks ? filters.view : "joint",
    });
  }, [filters, updateUrlWithFilters]);

  const handleSetAllBooks = useCallback(() => {
    updateUrlWithFilters({
      ...filters,
      myBooks: false,
      view: "todos",
      readers: [],
    });
  }, [filters, updateUrlWithFilters]);

  const handleSetJointReading = useCallback(() => {
    updateUrlWithFilters({ ...filters, myBooks: false, view: "joint" });
  }, [filters, updateUrlWithFilters]);

  const handleToggleReader = useCallback(
    (readerName: string) => {
      const allReaders = users.map((u) => u.display_name);
      const defaultReaders = isAllBooksActive ? defaultTodosReaders : allReaders;
      const currentReaders =
        filters.readers.length > 0 ? filters.readers : defaultReaders;

      const nextReaders = currentReaders.includes(readerName)
        ? currentReaders.filter((reader) => reader !== readerName)
        : [...currentReaders, readerName];

      updateUrlWithFilters({ ...filters, readers: nextReaders });
    },
    [filters, updateUrlWithFilters, users, isAllBooksActive, defaultTodosReaders],
  );

  const checkIsUserActive = useCallback(
    (readerName: string) => {
      if (isMyBooksActive) return false;

      if (isAllBooksActive) {
        const selectedTodosReaders =
          filters.readers.length > 0 ? filters.readers : defaultTodosReaders;
        return selectedTodosReaders.includes(readerName);
      }

      if (filters.readers.length === 0) {
        return true;
      }

      return filters.readers.includes(readerName);
    },
    [filters.readers, isMyBooksActive, isAllBooksActive, defaultTodosReaders],
  );

  const { activeStatuses, handleToggleStatus } = useStatusFilters({
    filters,
    searchQuery,
    updateUrlWithFilters,
  });

  const isLoadingData = isLoadingUsers || isLoadingAllBooks;

  const totalPages = Math.ceil((allBooks?.total || 0) / PAGE_SIZE);

  useEffect(() => {
    if (!allBooks?.total) return;

    const nextPage = currentPage + 1;
    const hasNextPage = nextPage < totalPages;
    if (!hasNextPage) return;
    if (!isMyBooksActive) return;

    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.books.list(
        serverFilters,
        searchQuery,
        nextPage,
        effectiveUserId,
      ),
      queryFn: () =>
        bookService.getAll({
          bookId: serverFilters.bookId,
          search: searchQuery,
          userId: effectiveUserId,
          relationshipUserValues,
          filters: {
            readers: [],
            status: serverFilters.status,
            gender: serverFilters.gender,
            year: serverFilters.year,
            view: serverFilters.view,
          },
          page: nextPage,
          pageSize: PAGE_SIZE,
        }),
      staleTime: 1000 * 60 * 5,
    });
  }, [
    allBooks?.total,
    currentPage,
    effectiveUserId,
    relationshipUserValues,
    serverFilters,
    isMyBooksActive,
    queryClient,
    searchQuery,
    totalPages,
  ]);

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
    handleSetAllBooks,
    handleSetJointReading,
    handleToggleReader,
    checkIsUserActive,
    isMyBooksActive,
    isAllBooksActive,
    isLoggedIn,
    users,
    readers,
  };
}
