import { QUERY_KEYS } from "@/constants/keys";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { SearchAutocompleteService } from "../services/searchAutocomplete.service";

const DEBOUNCE_MS = 300;
const MIN_TERM_SIZE = 2;

export function useSearchAutocomplete(searchTerm: string) {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchTerm]);

  const service = useMemo(() => new SearchAutocompleteService(), []);
  const normalizedTerm = debouncedTerm.trim();

  const query = useQuery({
    queryKey: QUERY_KEYS.search.autocomplete(normalizedTerm),
    queryFn: () => service.search(normalizedTerm),
    staleTime: 1000 * 60 * 5,
    enabled: normalizedTerm.length >= MIN_TERM_SIZE,
    placeholderData: (previousData) => previousData,
  });

  const groupedResults = useMemo(() => {
    const results = query.data ?? [];
    return {
      books: results.filter((result) => result.type === "book"),
      authors: results.filter((result) => result.type === "author"),
    };
  }, [query.data]);

  return {
    ...query,
    debouncedTerm: normalizedTerm,
    groupedResults,
    shouldSearch: normalizedTerm.length >= MIN_TERM_SIZE,
  };
}
