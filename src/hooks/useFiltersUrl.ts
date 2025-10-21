import { useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { InputWithButtonRef } from "@/components/inputWithButton/inputWithButton";
import { FiltersOptions } from "@/types/filters";

import {
  parseFiltersFromSearchParams,
  buildQueryStringFromFilters,
} from "@/utils";

export function useFiltersUrl(defaultFiltersFactory: () => FiltersOptions) {
  const inputRef = useRef<InputWithButtonRef>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const defaultFilters = useMemo(
    () => defaultFiltersFactory(),
    [defaultFiltersFactory]
  );

  const { filters, searchQuery } = useMemo(() => {
    const sp = new URLSearchParams(searchParams.toString());
    const parsed = parseFiltersFromSearchParams(sp);
    const hasAnyParam = sp.toString().length > 0;
    if (!hasAnyParam) return { filters: defaultFilters, searchQuery: "" };
    return parsed;
  }, [searchParams, defaultFilters]);

  const hasSearchParams = searchParams.toString().length > 0;

  const updateUrlWithFilters = useCallback(
    (newFilters: FiltersOptions, search?: string, bookId?: string) => {
      const qs = buildQueryStringFromFilters(newFilters, search, bookId);
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
    updateUrlWithFilters(defaultFilters, "");
    if (inputRef.current) inputRef.current.clear();
  }, [defaultFilters, updateUrlWithFilters]);

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

  return {
    filters,
    searchQuery,
    hasSearchParams,
    inputRef,
    updateUrlWithFilters,
    handleOnPressEnter,
    handleClearAllFilters,
    handleInputBlur,
    handleSearchButtonClick,
  };
}
