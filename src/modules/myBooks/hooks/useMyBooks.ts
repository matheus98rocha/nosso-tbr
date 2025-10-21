import { BookService } from "@/services/books/books.service";
import { useQuery } from "@tanstack/react-query";
import { useUserStore } from "@/stores/userStore";
import { useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { InputWithButtonRef } from "@/components/inputWithButton/inputWithButton";
import { FiltersOptions } from "@/modules/home/components/filtersSheet/hooks/useFiltersSheet";
import { formatList } from "@/modules/home/utils/formatList";
import { genders } from "@/modules/home/utils/genderBook";
import { STATUS_DICTIONARY } from "@/modules/home/constants/constants";

export type FiltersOptionsHome = {
  readers: string[];
  status: string[];
  gender: string[];
  bookId: string;
};

export function useMyBooks() {
  const inputRef = useRef<InputWithButtonRef>(null);
  const fetchUser = useUserStore((state) => state.fetchUser);
  const bookService = new BookService();

  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUserStore();

  const DEFAULT_FILTERS = useMemo<FiltersOptionsHome>(
    () => ({
      readers: [],
      status: [],
      gender: [],
      userId: "",
      bookId: "",
    }),
    []
  );

  const filters = useMemo((): FiltersOptionsHome => {
    const hasParams =
      searchParams.get("readers") ||
      searchParams.get("status") ||
      searchParams.get("gender") ||
      searchParams.get("userId") ||
      searchParams.get("bookId");

    if (!hasParams) {
      return DEFAULT_FILTERS;
    }

    const readers =
      searchParams
        .get("readers")
        ?.split(",")
        .filter(Boolean)
        .map(decodeURIComponent) ?? [];

    const status =
      searchParams
        .get("status")
        ?.split(",")
        .filter(Boolean)
        .map(decodeURIComponent) ?? [];

    const gender =
      searchParams
        .get("gender")
        ?.split(",")
        .filter(Boolean)
        .map(decodeURIComponent) ?? [];

    const bookId = searchParams.get("bookId") ?? "";

    return { readers, status, gender, bookId };
  }, [DEFAULT_FILTERS, searchParams]);

  const searchQuery = searchParams.get("search") ?? "";

  const {
    data: allBooks,
    isFetching: isLoadingAllBooks,
    isFetched,
    isError,
  } = useQuery({
    queryKey: ["books", filters, searchQuery, user?.id],
    queryFn: async () => {
      console.log(filters);
      return bookService.getAll({
        bookId: filters.bookId,
        filters,
        search: searchQuery,
        userId: user?.id,
      });
    },
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

  const updateUrlWithFilters = useCallback(
    (newFilters: FiltersOptions, search?: string, bookId?: string) => {
      const params = new URLSearchParams();

      if (search && search.trim()) {
        params.set("search", search.trim());
      }

      if (newFilters.readers.length) {
        params.set(
          "readers",
          newFilters.readers.map(encodeURIComponent).join(",")
        );
      }

      if (newFilters.status.length) {
        params.set(
          "status",
          newFilters.status.map(encodeURIComponent).join(",")
        );
      }

      if (newFilters.gender.length) {
        params.set(
          "gender",
          newFilters.gender.map(encodeURIComponent).join(",")
        );
      }

      const idToSet = bookId ?? newFilters.bookId;
      if (idToSet) {
        params.set("bookId", idToSet);
      }

      const qs = params.toString();
      const target = qs ? `?${qs}` : window.location.pathname;
      router.replace(target);
    },
    [router]
  );

  const handleOnPressEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;
    if (event.key === "Enter" && value.trim() !== "") {
      updateUrlWithFilters(filters, value);
    }
  };

  const handleClearAllFilters = useCallback(() => {
    updateUrlWithFilters(DEFAULT_FILTERS, "");
    if (inputRef.current) {
      inputRef.current.clear();
    }
  }, [DEFAULT_FILTERS, updateUrlWithFilters]);

  const handleInputBlur = useCallback(
    (value: string) => {
      updateUrlWithFilters(filters, value);
    },
    [filters, updateUrlWithFilters]
  );

  const handleSearchButtonClick = useCallback(
    (value: string) => {
      updateUrlWithFilters(filters, value);
    },
    [filters, updateUrlWithFilters]
  );

  const formattedGenres = useMemo(() => {
    if (!Array.isArray(filters.gender) || filters.gender.length === 0)
      return null;
    const labels = filters.gender.map(
      (value: string) => genders.find((g) => g.value === value)?.label ?? value
    );
    return formatList(labels);
  }, [filters.gender]);

  const formattedReaders = useMemo(() => {
    return Array.isArray(filters.readers) && filters.readers.length > 0
      ? formatList(filters.readers)
      : null;
  }, [filters.readers]);

  const formattedStatus = useMemo(() => {
    return Array.isArray(filters.status) && filters.status.length > 0
      ? formatList(
          filters.status.map(
            (value: string) =>
              `"${
                STATUS_DICTIONARY[value as keyof typeof STATUS_DICTIONARY] ??
                value
              }"`
          )
        )
      : null;
  }, [filters.status]);

  const isLoadingData = isLoadingAllBooks;
  const hasSearchParams = searchParams.toString().length > 0;

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
  };
}
