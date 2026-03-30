import { BookService } from "@/services/books/books.service";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/services/users/hooks/useUsers";
import { useUserStore } from "@/stores/userStore";
import { useCallback, useMemo, useState, useEffect } from "react";
import { FiltersOptions } from "@/types/filters";
import { useFiltersUrl } from "@/hooks/useFiltersUrl";
import {
  formatGenres,
  formatReaderIds,
  formatStatus,
  formatYear,
} from "@/utils/formatters/formatters";
import { BookMapper } from "@/services/books/books.mapper";
import { UserDomain } from "@/services/users/types/users.types";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { QUERY_KEYS } from "@/constants/keys";
import { useStatusFilters } from "@/hooks/useStatusFilters";
import { sortWithPriority } from "../utils";
import { UserSocialService } from "@/services/userSocial/userSocial.service";

const PAGE_SIZE = 8;
const JOINT_READINGS_FETCH_SIZE = 2000;
const bookService = new BookService();
const userSocialService = new UserSocialService();

export function useHome() {
  const queryClient = useQueryClient();
  const { users, isLoadingUsers } = useUser();
  const user = useUserStore((state) => state.user);
  const isLoggedIn = useIsLoggedIn();

  const [currentPage, setCurrentPage] = useState(0);
  const [lastNonMyBooksView, setLastNonMyBooksView] = useState<
    FiltersOptions["view"]
  >("todos");
  const { data: followingIdsData, isLoading: isLoadingFollowingIds } = useQuery({
    queryKey: ["userSocial", "following", user?.id],
    queryFn: () => userSocialService.getFollowingIds(),
    enabled: isLoggedIn && !!user?.id,
    staleTime: 1000 * 60 * 2,
  });


  const followingIds = useMemo(
    () => (Array.isArray(followingIdsData) ? followingIdsData : []),
    [followingIdsData],
  );

  const allowedTodosReaderIds = useMemo(() => {
    if (!isLoggedIn || !user?.id) return [] as string[];
    return [...new Set([user.id, ...followingIds])];
  }, [isLoggedIn, user?.id, followingIds]);

  const readers: UserDomain[] = useMemo(() => {
    if (isLoggedIn) {
      const allowed = new Set(allowedTodosReaderIds);
      const scopedUsers = users.filter((u: UserDomain) => allowed.has(u.id));
      return sortWithPriority(
        scopedUsers,
        scopedUsers.find((u: UserDomain) => u.id === user?.id)?.display_name ?? "",
      );
    }
    return users.map((u: UserDomain) => u);
  }, [users, user?.id, isLoggedIn, allowedTodosReaderIds]);

  const defaultFactory = useMemo(
    () => () => {
      return {
        readers: [],
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

  useEffect(() => {
    if (!filters.myBooks) {
      setLastNonMyBooksView(filters.view);
    }
  }, [filters.myBooks, filters.view]);

  const isAllBooksActive = filters.view !== "joint" && !filters.myBooks;
  const isMyBooksActive = !!(filters.myBooks && isLoggedIn && user?.id);

  const readersObj = useMemo(() => {
    if (isMyBooksActive) {
      return { readers: [], readersDisplay: "" };
    }

    const allIds = readers.map((u) => u.id);
    const selectedReaders =
      filters.readers.length > 0 ? filters.readers : allIds;
    const selectedSet = new Set(selectedReaders);
    const availableSet = new Set(allIds);
    const isAllReadersSelected =
      selectedSet.size > 0 &&
      selectedSet.size === availableSet.size &&
      [...selectedSet].every((id) => availableSet.has(id));

    const labelFor = (id: string) =>
      readers.find((u) => u.id === id)?.display_name ?? id;

    if (!isAllReadersSelected) {
      return {
        readers: selectedReaders,
        readersDisplay: selectedReaders.map(labelFor).join(", "),
      };
    }

    return {
      readers: [],
      readersDisplay: allIds.map(labelFor).join(", "),
    };
  }, [filters.readers, readers, isMyBooksActive]);

  const isAwaitingSpecificBook = useMemo(
    () => !!(filters.bookId || searchQuery),
    [filters.bookId, searchQuery],
  );

  const effectiveUserId = isMyBooksActive ? user!.id : undefined;
  const defaultTodosReaders = useMemo(
    () => allowedTodosReaderIds,
    [allowedTodosReaderIds],
  );

  const effectiveTodosReaders = useMemo(() => {
    const scopedReaders = filters.readers.filter((id) =>
      defaultTodosReaders.includes(id),
    );

    if (scopedReaders.length > 0) return scopedReaders;
    return defaultTodosReaders;
  }, [filters.readers, defaultTodosReaders]);

  const relationshipUserValues = useMemo(() => {
    if (!isAllBooksActive || !isLoggedIn) return undefined;
    const ids = effectiveTodosReaders.filter(Boolean);
    return ids.length > 0 ? ids : undefined;
  }, [isAllBooksActive, isLoggedIn, effectiveTodosReaders]);
  const shouldWaitForUsers =
    !isMyBooksActive && filters.readers.length === 0 && (isLoadingUsers || isLoadingFollowingIds);

  const serverFilters = useMemo(
    () => ({ ...filters, readers: [] as string[] }),
    [filters],
  );
  const shouldUseServerPagination = isMyBooksActive || isAllBooksActive;
  const serverPage = shouldUseServerPagination ? currentPage : 0;
  const serverPageSize = shouldUseServerPagination
    ? PAGE_SIZE
    : JOINT_READINGS_FETCH_SIZE;

  const relationshipKey = relationshipUserValues?.slice().sort().join("|") ?? "none";

  const {
    data: rawBooks,
    isFetching: isLoadingAllBooks,
    isFetched,
    isError,
  } = useQuery({
    queryKey: [
      ...QUERY_KEYS.books.list(serverFilters, searchQuery, serverPage, effectiveUserId),
      "relationship",
      relationshipKey,
    ],
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
    () => formatReaderIds(filters.readers, users),
    [filters.readers, users],
  );
  const formattedStatus = useMemo(
    () => formatStatus(filters.status),
    [filters.status],
  );
  const formattedYear = useMemo(() => formatYear(filters.year), [filters.year]);

  const allReaderIds = useMemo(() => users.map((u) => u.id), [users]);
  const effectiveSelectedReaders = useMemo(
    () => (filters.readers.length > 0 ? filters.readers : allReaderIds),
    [filters.readers, allReaderIds],
  );

  const booksQueryData = useMemo(() => {
    if (!rawBooks?.data) return rawBooks;
    return {
      ...rawBooks,
      data: rawBooks.data.map((b) => BookMapper.enrichReadersDisplay(b, users)),
    };
  }, [rawBooks, users]);

  const allBooks = useMemo(() => {
    if (!booksQueryData) {
      return booksQueryData;
    }

    if (isMyBooksActive || isAllBooksActive) {
      return booksQueryData;
    }

    const selectedReadersSet = new Set(effectiveSelectedReaders);
    const filteredJointBooks = booksQueryData.data.filter((book) => {
      if (book.readerIds.length < 2) {
        return false;
      }

      if (selectedReadersSet.size === 0) {
        return true;
      }

      return [...selectedReadersSet].some((id) => book.readerIds.includes(id));
    });

    const from = currentPage * PAGE_SIZE;
    const to = from + PAGE_SIZE;

    return {
      data: filteredJointBooks.slice(from, to),
      total: filteredJointBooks.length,
    };
  }, [
    booksQueryData,
    isMyBooksActive,
    isAllBooksActive,
    effectiveSelectedReaders,
    currentPage,
  ]);

  const canClear = useMemo(
    () =>
      (!!searchQuery && hasSearchParams) ||
      filters.gender?.length > 0 ||
      (effectiveTodosReaders.length > 0 &&
        (hasSearchParams ||
          (isAllBooksActive &&
            JSON.stringify(effectiveTodosReaders) !==
              JSON.stringify(defaultTodosReaders)))) ||
      filters.status?.length > 0 ||
      !!filters.year ||
      filters.view === "joint" ||
      !!filters.myBooks,
    [
      searchQuery,
      hasSearchParams,
      filters,
      isAllBooksActive,
      defaultTodosReaders,
      effectiveTodosReaders,
    ],
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
      view: nextMyBooks ? filters.view : lastNonMyBooksView,
    });
  }, [filters, updateUrlWithFilters, lastNonMyBooksView]);

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
    (readerId: string) => {
      const defaultReaders = isAllBooksActive ? defaultTodosReaders : allReaderIds;
      const currentReaders =
        isAllBooksActive ? effectiveTodosReaders : filters.readers.length > 0 ? filters.readers : defaultReaders;

      const nextReaders = currentReaders.includes(readerId)
        ? currentReaders.filter((id) => id !== readerId)
        : [...currentReaders, readerId];

      updateUrlWithFilters({ ...filters, readers: nextReaders });
    },
    [
      filters,
      updateUrlWithFilters,
      allReaderIds,
      isAllBooksActive,
      defaultTodosReaders,
      effectiveTodosReaders,
    ],
  );

  const checkIsUserActive = useCallback(
    (readerId: string) => {
      if (isMyBooksActive) return false;

      if (isAllBooksActive) {
        return effectiveTodosReaders.includes(readerId);
      }

      if (filters.readers.length === 0) {
        return true;
      }

      return filters.readers.includes(readerId);
    },
    [filters.readers, isMyBooksActive, isAllBooksActive, effectiveTodosReaders],
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
