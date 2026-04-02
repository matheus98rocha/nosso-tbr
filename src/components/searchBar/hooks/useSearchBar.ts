"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SearchAutocompleteDomain } from "@/components/header/types/searchAutocomplete.types";
import type { SearchBarProps } from "../types/searchBar.types";

export function useSearchBar({
  groupedResults,
  shouldSearch,
  onButtonClick,
  onSelectSuggestion,
}: Pick<
  SearchBarProps,
  "groupedResults" | "shouldSearch" | "onButtonClick" | "onSelectSuggestion"
>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);

  const hasResults = useMemo(
    () =>
      groupedResults.books.length > 0 || groupedResults.authors.length > 0,
    [groupedResults.authors.length, groupedResults.books.length],
  );

  const showAutocomplete = useMemo(
    () => isAutocompleteOpen && Boolean(shouldSearch),
    [isAutocompleteOpen, shouldSearch],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;

      if (containerRef.current.contains(event.target as Node)) return;

      setIsAutocompleteOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFocusInput = useCallback(() => {
    setIsAutocompleteOpen(true);
  }, []);

  const handleButtonClick = useCallback(
    (value: string) => {
      onButtonClick?.(value);
      setIsAutocompleteOpen(false);
    },
    [onButtonClick],
  );

  const handleSelectBook = useCallback(
    (book: SearchAutocompleteDomain) => {
      onSelectSuggestion?.(book);
      setIsAutocompleteOpen(false);
    },
    [onSelectSuggestion],
  );

  const handleSelectAuthor = useCallback(
    (author: SearchAutocompleteDomain) => {
      onSelectSuggestion?.(author);
      setIsAutocompleteOpen(false);
    },
    [onSelectSuggestion],
  );

  return {
    containerRef,
    showAutocomplete,
    hasResults,
    handleFocusInput,
    handleButtonClick,
    handleSelectBook,
    handleSelectAuthor,
  };
}
