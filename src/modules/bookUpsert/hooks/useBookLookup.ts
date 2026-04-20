import { useCallback, useState } from "react";
import {
  BookCandidate,
  BookSearchResponse,
} from "../types/bookCandidate.types";

async function fetchBookCandidates(query: string): Promise<BookCandidate[]> {
  const res = await fetch(
    `/api/book-lookup?q=${encodeURIComponent(query)}&limit=5`,
  );
  if (!res.ok) throw new Error("Falha ao buscar livros");
  const data: BookSearchResponse = await res.json();
  return data.candidates;
}

export function useBookLookup() {
  const [candidates, setCandidates] = useState<BookCandidate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [lookupQuery, setLookupQuery] = useState("");

  const searchBooks = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setIsSearching(true);
    setHasSearched(false);
    try {
      const results = await fetchBookCandidates(trimmed);
      setCandidates(results);
    } finally {
      setIsSearching(false);
      setHasSearched(true);
    }
  }, []);

  const clearCandidates = useCallback(() => {
    setCandidates([]);
    setHasSearched(false);
    setLookupQuery("");
  }, []);

  const handleLookupQueryChange = useCallback((query: string) => {
    setLookupQuery(query);
  }, []);

  const handleSearchBooks = useCallback(() => {
    searchBooks(lookupQuery);
  }, [lookupQuery, searchBooks]);

  return {
    candidates,
    isSearching,
    hasSearched,
    lookupQuery,
    handleLookupQueryChange,
    handleSearchBooks,
    clearCandidates,
  };
}
