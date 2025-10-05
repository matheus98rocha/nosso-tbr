import { BookService } from "@/services/books/books.service";
import { useQuery } from "@tanstack/react-query";
import { useUserStore } from "@/stores/userStore";
import { useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { STATUS_DICTIONARY } from "../constants/constants";
import { formatList } from "../utils/formatList";
import { genders } from "../utils/genderBook";
import { InputWithButtonRef } from "@/components/inputWithButton/inputWithButton";
import { FiltersOptions } from "../components/filtersSheet/hooks/useFiltersSheet";
import { useUser } from "@/services/users/hooks/useUsers";

export type FiltersOptionsHome = {
  readers: string[];
  status: string[];
  gender: string[];
  userId: string;
};

export function useHome() {
  const inputRef = useRef<InputWithButtonRef>(null);
  const fetchUser = useUserStore((state) => state.fetchUser);
  const bookService = new BookService();

  const searchParams = useSearchParams();
  const router = useRouter();
  const { users, isLoadingUsers } = useUser();

  const DEFAULT_FILTERS = useMemo<FiltersOptionsHome>(
    () => ({
      readers: users.map((user) => user.display_name),
      status: [],
      gender: [],
      userId: "",
    }),
    [users]
  );

  const filters = useMemo((): FiltersOptionsHome => {
    const hasParams =
      searchParams.get("readers") ||
      searchParams.get("status") ||
      searchParams.get("gender") ||
      searchParams.get("userId");

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

    const userId = searchParams.get("userId") ?? "";

    return { readers, status, gender, userId };
  }, [DEFAULT_FILTERS, searchParams]);

  const searchQuery = searchParams.get("search") ?? "";

  const {
    data: allBooks,
    isFetching: isLoadingAllBooks,
    isFetched,
    isError,
  } = useQuery({
    queryKey: ["books", filters, searchQuery],
    queryFn: async () => {
      return bookService.getAll(filters, searchQuery, filters.userId);
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
    (newFilters: FiltersOptions, search?: string) => {
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

  const isLoadingData = isLoadingUsers || isLoadingAllBooks;
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
