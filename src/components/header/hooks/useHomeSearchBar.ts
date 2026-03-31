import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { InputWithButtonRef } from "@/components/inputWithButton";
import { FiltersOptions } from "@/types/filters";
import { useSearchAutocomplete } from "./useSearchAutocomplete";
import { SearchAutocompleteDomain } from "../types/searchAutocomplete.types";
import { buildQueryStringFromFilters, parseFiltersFromSearchParams } from "@/utils";

export function useHomeSearchBar() {
  const inputRef = useRef<InputWithButtonRef>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const filters = useMemo((): FiltersOptions => {
    const parsed = parseFiltersFromSearchParams(
      new URLSearchParams(searchParams.toString()),
    );

    return parsed.filters;
  }, [searchParams]);

  const searchQuery = searchParams.get("search") ?? "";
  const [inputValue, setInputValue] = useState(searchQuery);

  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  const deferredInputValue = useDeferredValue(inputValue);

  const {
    groupedResults,
    isLoading: isLoadingSuggestions,
    shouldSearch,
  } = useSearchAutocomplete(deferredInputValue);

  const updateUrlWithFilters = useCallback(
    (newFilters: FiltersOptions, search?: string, selectedBookId?: string) => {
      const qs = buildQueryStringFromFilters(newFilters, search, selectedBookId);
      if (qs === searchParams.toString()) return;

      const target = qs ? `?${qs}` : window.location.pathname;
      router.replace(target);
    },
    [router, searchParams]
  );

  const handleOnPressEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;
    if (event.key === "Enter" && value.trim() !== "") {
      updateUrlWithFilters({ ...filters, bookId: "", authorId: "" }, value);
    }
  };

  // const handleClearAllFilters = useCallback(() => {
  //   const cleared = { readers: [], gender: [], status: [] };
  //   updateUrlWithFilters(cleared, "");
  //   if (inputRef.current) {
  //     inputRef.current.clear();
  //   }
  // }, [updateUrlWithFilters]);

  const handleInputBlur = useCallback(
    (value: string) => {
      updateUrlWithFilters({ ...filters, bookId: "", authorId: "" }, value);
    },
    [filters, updateUrlWithFilters]
  );

  const handleSearchButtonClick = useCallback(
    (value: string) => {
      updateUrlWithFilters({ ...filters, bookId: "", authorId: "" }, value);
    },
    [filters, updateUrlWithFilters]
  );

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  const handleSelectSuggestion = useCallback(
    (result: SearchAutocompleteDomain) => {
      if (result.type === "book") {
        updateUrlWithFilters(
          { ...filters, bookId: result.id, authorId: "" },
          result.label,
          result.id,
        );
        setInputValue(result.label);
        return;
      }

      updateUrlWithFilters(
        { ...filters, authorId: result.id, bookId: "" },
        result.label,
        "",
      );
      setInputValue(result.label);
    },
    [filters, updateUrlWithFilters],
  );

  // const formattedGenres = useMemo(() => {
  //   if (!Array.isArray(filters.gender) || filters.gender.length === 0)
  //     return null;
  //   const labels = filters.gender.map(
  //     (value: string) => genders.find((g) => g.value === value)?.label ?? value
  //   );
  //   return formatList(labels);
  // }, [filters.gender]);

  // const formattedReaders = useMemo(() => {
  //   return Array.isArray(filters.readers) && filters.readers.length > 0
  //     ? formatList(filters.readers)
  //     : null;
  // }, [filters.readers]);

  // const formattedStatus = useMemo(() => {
  //   return Array.isArray(filters.status) && filters.status.length > 0
  //     ? formatList(
  //         filters.status.map(
  //           (value: string) =>
  //             `"${
  //               STATUS_DICTIONARY[value as keyof typeof STATUS_DICTIONARY] ??
  //               value
  //             }"`
  //         )
  //       )
  //     : null;
  // }, [filters.status]);

  return {
    searchQuery,
    inputValue,
    handleInputBlur,
    handleSearchButtonClick,
    handleOnPressEnter,
    handleInputChange,
    handleSelectSuggestion,
    inputRef,
    filters,
    updateUrlWithFilters,
    groupedResults,
    isLoadingSuggestions,
    shouldSearch,
  };
}
