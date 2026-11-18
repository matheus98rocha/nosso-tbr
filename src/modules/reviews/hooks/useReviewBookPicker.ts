"use client";

import { useCallback, useMemo, useState } from "react";

import { filterReviewBooks } from "../utils";
import { useReviewBookOptions } from "./useReviewBookOptions";

export function useReviewBookPicker(enabled: boolean) {
  const { books, isLoading, isError } = useReviewBookOptions(enabled);
  const [query, setQuery] = useState("");

  const onQueryChange = useCallback((value: string) => {
    setQuery(value);
  }, []);

  const visibleBooks = useMemo(() => filterReviewBooks(books, query), [books, query]);

  return useMemo(
    () => ({
      query,
      onQueryChange,
      visibleBooks,
      isLoading,
      isError,
    }),
    [isError, isLoading, onQueryChange, query, visibleBooks],
  );
}
