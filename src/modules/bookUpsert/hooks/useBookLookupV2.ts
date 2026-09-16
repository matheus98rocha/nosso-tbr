import { useCallback, useRef, useState } from "react";

import type { BookLookupData } from "../types/bookLookup.types";

type LookupParams =
  | { type: "title"; value: string; lang?: string }
  | { type: "isbn"; value: string };

export function useBookLookupV2() {
  const [book, setBook] = useState<BookLookupData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const lookup = useCallback(async (params: LookupParams) => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    setBook(null);

    const searchParams = new URLSearchParams();
    if (params.type === "title") {
      searchParams.set("title", params.value);
      if (params.lang) searchParams.set("lang", params.lang);
    } else {
      searchParams.set("isbn", params.value);
    }

    try {
      const res = await fetch(
        `/api/book-lookup-v2?${searchParams.toString()}`,
      );

      if (requestId !== requestIdRef.current) return;

      if (res.status === 404) {
        setError("Nenhum livro encontrado.");
        return;
      }
      if (res.status === 400) {
        setError("ISBN inválido.");
        return;
      }
      if (!res.ok) {
        setError("Erro ao buscar livro. Tente novamente.");
        return;
      }

      const data = await res.json();
      if (requestId !== requestIdRef.current) return;
      setBook(data.book);
    } catch {
      if (requestId !== requestIdRef.current) return;
      setError("Erro de conexão.");
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const clear = useCallback(() => {
    requestIdRef.current += 1;
    setBook(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { book, isLoading, error, lookup, clear };
}
