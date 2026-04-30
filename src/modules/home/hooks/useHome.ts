import { BookService } from "@/services/books/books.service";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/services/users/hooks/useUsers";
import { useUserStore } from "@/stores/userStore";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiltersOptions, SortOption } from "@/types/filters";
import {
  formatGenres,
  formatReaderIds,
  formatStatus,
  formatYear,
} from "@/utils/formatters";
import { BookMapper } from "@/services/books/books.mapper";
import { UserDomain } from "@/services/users/types/users.types";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { QUERY_KEYS } from "@/constants/keys";
import { useFiltersUrl, useStatusFilters } from "@/hooks";
import { sortWithPriority } from "../utils";
import { UserSocialService } from "@/services/userSocial/userSocial.service";
import { useBookSearchRefinement } from "./useBookSearchRefinement";

const PAGE_SIZE = 8;
const JOINT_READINGS_FETCH_SIZE = 2000;
const bookService = new BookService();
const userSocialService = new UserSocialService();

const SORT_LABEL_MAP: Record<string, string> = {
  pages_asc: "Menos páginas",
  pages_desc: "Mais páginas",
};

export function useHome() {
  const queryClient = useQueryClient();
  const { users, isLoadingUsers } = useUser();
  const user = useUserStore((state) => state.user);
  const isLoggedIn = useIsLoggedIn();

  const [currentPage, setCurrentPage] = useState(0);
  const [lastNonMyBooksView, setLastNonMyBooksView] =
    useState<FiltersOptions["view"]>("todos");
  const { data: followingIdsData, isLoading: isLoadingFollowingIds } = useQuery(
    {
      queryKey: ["userSocial", "following", user?.id],
      queryFn: () => userSocialService.getFollowingIds(),
      enabled: isLoggedIn && !!user?.id,
      staleTime: 1000 * 60 * 2,
    },
  );

  const followingIds = useMemo(
    () => (Array.isArray(followingIdsData) ? followingIdsData : []),
    [followingIdsData],
  );

  const allowedTodosReaderIds = useMemo(() => {
    if (!isLoggedIn || !user?.id) return [] as string[];
    return [...new Set([user.id, ...followingIds])];
  }, [isLoggedIn, user?.id, followingIds]);
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

  const readers: UserDomain[] = useMemo(() => {
    if (isLoggedIn) {
      let scopeIds: string[];
      if (filters.myBooks) {
        scopeIds = [];
      } else if (filters.view === "seguindo") {
        scopeIds = followingIds;
      } else if (filters.view === "todos") {
        scopeIds = user?.id ? [user.id] : [];
      } else {
        scopeIds = allowedTodosReaderIds;
      }
      const allowed = new Set(scopeIds);
      const scopedUsers = users.filter((u: UserDomain) => allowed.has(u.id));
      const priorityName =
        filters.view === "seguindo"
          ? (scopedUsers[0]?.display_name ?? "")
          : (scopedUsers.find((u: UserDomain) => u.id === user?.id)
              ?.display_name ?? "");
      return sortWithPriority(scopedUsers, priorityName);
    }
    return users.map((u: UserDomain) => u);
  }, [
    users,
    user?.id,
    isLoggedIn,
    filters.myBooks,
    filters.view,
    followingIds,
    allowedTodosReaderIds,
  ]);

  useEffect(() => {
    setCurrentPage(0);
  }, [filters, searchQuery]);

  useEffect(() => {
    if (!filters.myBooks) {
      setLastNonMyBooksView(filters.view);
    }
  }, [filters.myBooks, filters.view]);

  const isFollowingFeedActive = !!(
    isLoggedIn &&
    filters.view === "seguindo" &&
    !filters.myBooks
  );

  const isAllBooksActive = filters.view === "todos" && !filters.myBooks;
  const isMyBooksActive = !!(filters.myBooks && isLoggedIn && user?.id);

  const lockedReaderId = useMemo(() => {
    if (!isLoggedIn || !user?.id || isMyBooksActive) return undefined;
    if (filters.view === "joint") return user.id;
    return undefined;
  }, [isLoggedIn, user?.id, isMyBooksActive, filters.view]);

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

  const shouldThrowSyncOnEmpty = useMemo(
    () => !!searchQuery.trim() && !filters.bookId?.trim(),
    [searchQuery, filters.bookId],
  );

  const effectiveUserId = isMyBooksActive ? user!.id : undefined;
  const defaultScopedReaders = useMemo(() => {
    if (filters.myBooks) return [] as string[];
    if (filters.view === "seguindo") {
      return isLoggedIn ? followingIds : ([] as string[]);
    }
    if (filters.view === "todos") {
      return isLoggedIn && user?.id ? [user.id] : allowedTodosReaderIds;
    }
    return allowedTodosReaderIds;
  }, [
    filters.myBooks,
    filters.view,
    isLoggedIn,
    followingIds,
    allowedTodosReaderIds,
    user?.id,
  ]);

  const effectiveScopedReaders = useMemo(() => {
    const scopedReaders = filters.readers.filter((id) =>
      defaultScopedReaders.includes(id),
    );

    if (scopedReaders.length > 0) {
      if (lockedReaderId && !scopedReaders.includes(lockedReaderId)) {
        return [lockedReaderId, ...scopedReaders];
      }
      return scopedReaders;
    }
    return defaultScopedReaders;
  }, [filters.readers, defaultScopedReaders, lockedReaderId]);

  const usesRelationshipScopedQuery =
    !!isLoggedIn && (isAllBooksActive || isFollowingFeedActive);

  const relationshipUserValues = useMemo(() => {
    if (!usesRelationshipScopedQuery) return undefined;
    const ids = effectiveScopedReaders.filter(Boolean);
    return ids.length > 0 ? ids : undefined;
  }, [usesRelationshipScopedQuery, effectiveScopedReaders]);
  const shouldWaitForUsers =
    !isMyBooksActive &&
    filters.readers.length === 0 &&
    (isLoadingUsers ||
      (isLoadingFollowingIds &&
        !isAllBooksActive &&
        (filters.view === "seguindo" || filters.view === "joint")));

  const serverFilters = useMemo(
    () => ({ ...filters, readers: [] as string[] }),
    [filters],
  );
  const shouldUseServerPagination =
    isMyBooksActive || isAllBooksActive || isFollowingFeedActive;
  const serverPage = shouldUseServerPagination ? currentPage : 0;
  const serverPageSize = shouldUseServerPagination
    ? PAGE_SIZE
    : JOINT_READINGS_FETCH_SIZE;

  const relationshipKey =
    relationshipUserValues?.slice().sort().join("|") ?? "none";

  const excludeBookParticipantUserId = useMemo(
    () =>
      isFollowingFeedActive && user?.id ? user.id : undefined,
    [isFollowingFeedActive, user?.id],
  );

  const {
    data: rawBooks,
    isFetching: isLoadingAllBooks,
    isFetched,
    isError,
  } = useQuery({
    queryKey: [
      ...QUERY_KEYS.books.list(
        serverFilters,
        searchQuery,
        serverPage,
        effectiveUserId,
      ),
      "relationship",
      relationshipKey,
      "excludeParticipant",
      excludeBookParticipantUserId ?? "none",
    ],
    queryFn: async () => {
      if (
        isLoggedIn &&
        isFollowingFeedActive &&
        relationshipUserValues == null &&
        followingIds.length === 0
      ) {
        return { data: [], total: 0 };
      }
      if (isLoggedIn) {
        const response = await bookService.getAll({
          bookId: filters.bookId,
          authorId: filters.authorId,
          search: searchQuery,
          userId: effectiveUserId,
          relationshipUserValues,
          excludeBookParticipantUserId,
          filters: {
            readers: [],
            status: serverFilters.status,
            gender: serverFilters.gender,
            year: serverFilters.year,
            view: serverFilters.view,
            sort: serverFilters.sort,
          },
          page: serverPage,
          pageSize: serverPageSize,
        });

        if (
          shouldThrowSyncOnEmpty &&
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
          sort: filters.sort,
        },
        page: serverPage,
        pageSize: serverPageSize,
      });

      return response;
    },
    retry: (failureCount) => {
      if (isLoggedIn && shouldThrowSyncOnEmpty && failureCount < 2) {
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
  const networkReaderIds = useMemo(
    () => readers.map((u) => u.id),
    [readers],
  );
  const effectiveSelectedReaders = useMemo(() => {
    const defaultWhenEmpty =
      isAllBooksActive || isFollowingFeedActive ? allReaderIds : networkReaderIds;
    const base = filters.readers.length > 0 ? filters.readers : defaultWhenEmpty;
    if (lockedReaderId && !base.includes(lockedReaderId)) {
      return [lockedReaderId, ...base];
    }
    return base;
  }, [
    filters.readers,
    allReaderIds,
    networkReaderIds,
    isAllBooksActive,
    isFollowingFeedActive,
    lockedReaderId,
  ]);

  const needsExtraReader = useMemo(() => {
    if (filters.view !== "joint" || !lockedReaderId) return false;
    if (filters.readers.length === 0) return false;
    return filters.readers.filter((id) => id !== lockedReaderId).length === 0;
  }, [filters.view, filters.readers, lockedReaderId]);

  const booksQueryData = useMemo(() => {
    if (!rawBooks?.data) return rawBooks;
    return {
      ...rawBooks,
      data: rawBooks.data.map((b) => BookMapper.enrichReadersDisplay(b, users)),
    };
  }, [rawBooks, users]);

  const { refinedBooks } = useBookSearchRefinement({
    books: booksQueryData?.data ?? [],
    searchTerm: searchQuery,
    isEnabled: Boolean(searchQuery?.trim()),
  });

  const booksQueryDataWithRefinement = useMemo(() => {
    if (!booksQueryData) return booksQueryData;
    return {
      ...booksQueryData,
      data: refinedBooks,
    };
  }, [booksQueryData, refinedBooks]);

  const allBooks = useMemo(() => {
    if (!booksQueryDataWithRefinement) {
      return booksQueryDataWithRefinement;
    }

    if (isMyBooksActive || isAllBooksActive || isFollowingFeedActive) {
      return booksQueryDataWithRefinement;
    }

    const selectedReadersSet = new Set(effectiveSelectedReaders);
    const filteredJointBooks = booksQueryDataWithRefinement.data.filter(
      (book) => {
        if (book.readerIds.length < 2) {
          return false;
        }

        if (selectedReadersSet.size === 0) {
          return true;
        }

        return [...selectedReadersSet].some((id) =>
          book.readerIds.includes(id),
        );
      },
    );

    const from = currentPage * PAGE_SIZE;
    const to = from + PAGE_SIZE;

    return {
      data: filteredJointBooks.slice(from, to),
      total: filteredJointBooks.length,
    };
  }, [
    booksQueryDataWithRefinement,
    isMyBooksActive,
    isAllBooksActive,
    isFollowingFeedActive,
    effectiveSelectedReaders,
    currentPage,
  ]);

  const canClear = useMemo(
    () =>
      (!!searchQuery && hasSearchParams) ||
      filters.gender?.length > 0 ||
      (effectiveScopedReaders.length > 0 &&
        (hasSearchParams ||
          ((isAllBooksActive || isFollowingFeedActive) &&
            JSON.stringify(effectiveScopedReaders) !==
              JSON.stringify(defaultScopedReaders)))) ||
      filters.status?.length > 0 ||
      !!filters.year ||
      !!filters.sort ||
      filters.view === "joint" ||
      filters.view === "seguindo" ||
      !!filters.myBooks,
    [
      searchQuery,
      hasSearchParams,
      filters,
      isAllBooksActive,
      isFollowingFeedActive,
      defaultScopedReaders,
      effectiveScopedReaders,
    ],
  );

  const activeFilterLabels = useMemo(() => {
    const labels: string[] = [];
    if (filters.myBooks) labels.push("Meus Livros");
    if (searchQuery) labels.push(`"${searchQuery}"`);
    if (formattedGenres) labels.push(formattedGenres);
    if (filters.view === "joint" && !isMyBooksActive && formattedReaders) {
      labels.push(`Leitores: ${readersObj.readersDisplay}`);
    }
    if (filters.view === "seguindo" && !filters.myBooks) {
      if (formattedReaders && formattedReaders.trim() !== "") {
        labels.push(`Seguindo · ${readersObj.readersDisplay}`);
      } else {
        labels.push("Seguindo");
      }
    }
    if (formattedStatus) labels.push(formattedStatus);
    if (formattedYear) labels.push(`Ano: ${formattedYear}`);
    if (filters.sort) labels.push(`Ordem: ${SORT_LABEL_MAP[filters.sort]}`);
    return labels;
  }, [
    searchQuery,
    formattedGenres,
    formattedReaders,
    formattedStatus,
    formattedYear,
    readersObj.readersDisplay,
    filters.myBooks,
    filters.sort,
    isMyBooksActive,
    filters.view,
  ]);

  const handleSetYear = useCallback(
    (year: number | undefined) => {
      updateUrlWithFilters({ ...filters, year });
    },
    [filters, updateUrlWithFilters],
  );

  const handleSetSort = useCallback(
    (sort: SortOption | undefined) => {
      updateUrlWithFilters({ ...filters, sort });
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

  const handleSetFollowingFeed = useCallback(() => {
    updateUrlWithFilters({
      ...filters,
      myBooks: false,
      view: "seguindo",
      readers: [],
    });
  }, [filters, updateUrlWithFilters]);

  const handleToggleReader = useCallback(
    (readerId: string) => {
      if (isAllBooksActive) return;
      if (readerId === lockedReaderId) return;

      const isScopedRelationshipView =
        isAllBooksActive || isFollowingFeedActive;
      const defaultReaders = isScopedRelationshipView
        ? defaultScopedReaders
        : networkReaderIds;
      const currentReaders = isScopedRelationshipView
        ? effectiveScopedReaders
        : filters.readers.length > 0
          ? filters.readers
          : defaultReaders;

      const nextReaders = currentReaders.includes(readerId)
        ? currentReaders.filter((id) => id !== readerId)
        : [...currentReaders, readerId];

      updateUrlWithFilters({ ...filters, readers: nextReaders });
    },
    [
      filters,
      updateUrlWithFilters,
      isAllBooksActive,
      isFollowingFeedActive,
      defaultScopedReaders,
      effectiveScopedReaders,
      lockedReaderId,
      networkReaderIds,
    ],
  );

  const checkIsUserActive = useCallback(
    (readerId: string) => {
      if (isMyBooksActive) return false;

      if (isAllBooksActive || isFollowingFeedActive) {
        return effectiveScopedReaders.includes(readerId);
      }

      return effectiveSelectedReaders.includes(readerId);
    },
    [
      isMyBooksActive,
      isAllBooksActive,
      isFollowingFeedActive,
      effectiveScopedReaders,
      effectiveSelectedReaders,
    ],
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
      queryKey: [
        ...QUERY_KEYS.books.list(
          serverFilters,
          searchQuery,
          nextPage,
          effectiveUserId,
        ),
        "relationship",
        relationshipKey,
        "excludeParticipant",
        excludeBookParticipantUserId ?? "none",
      ],
      queryFn: () =>
        bookService.getAll({
          bookId: serverFilters.bookId,
          search: searchQuery,
          userId: effectiveUserId,
          relationshipUserValues,
          excludeBookParticipantUserId,
          filters: {
            readers: [],
            status: serverFilters.status,
            gender: serverFilters.gender,
            year: serverFilters.year,
            view: serverFilters.view,
            sort: serverFilters.sort,
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
    relationshipKey,
    relationshipUserValues,
    serverFilters,
    isMyBooksActive,
    queryClient,
    searchQuery,
    totalPages,
    excludeBookParticipantUserId,
  ]);

  const followingFeedEmpty = useMemo(
    () =>
      isFollowingFeedActive &&
      !isLoadingFollowingIds &&
      followingIds.length === 0,
    [isFollowingFeedActive, isLoadingFollowingIds, followingIds.length],
  );

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
    handleSetSort,
    canClear,
    activeFilterLabels,
    handleToggleMyBooks,
    handleSetAllBooks,
    handleSetJointReading,
    handleSetFollowingFeed,
    handleToggleReader,
    checkIsUserActive,
    isMyBooksActive,
    isAllBooksActive,
    isFollowingFeedActive,
    isLoggedIn,
    followingFeedEmpty,
    users,
    readers,
    lockedReaderId,
    needsExtraReader,
  };
}
