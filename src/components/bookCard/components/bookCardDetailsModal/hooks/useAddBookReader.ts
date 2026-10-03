"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { apiJson } from "@/lib/api/clientJsonFetch";
import { READER_CANDIDATE_MIN_LENGTH } from "@/lib/books/readerCandidates";

import type {
  AddBookReaderState,
  ReaderCandidate,
} from "../types/addBookReader.types";

const SEARCH_DEBOUNCE_MS = 300;

type UseAddBookReaderParams = {
  bookId: string;
  enabled: boolean;
};

type ReaderCandidatesResponse = {
  candidates: ReaderCandidate[];
};

export function useAddBookReader({
  bookId,
  enabled,
}: UseAddBookReaderParams): AddBookReaderState {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedTerm(term);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [term]);

  const normalizedTerm = debouncedTerm.trim();
  const shouldSearch = normalizedTerm.length >= READER_CANDIDATE_MIN_LENGTH;

  const candidatesQuery = useQuery({
    queryKey: ["books", "reader-candidates", bookId, normalizedTerm],
    queryFn: () =>
      apiJson<ReaderCandidatesResponse>(
        `/api/books/${encodeURIComponent(bookId)}/reader-candidates?q=${encodeURIComponent(normalizedTerm)}`,
      ),
    enabled: enabled && open && shouldSearch && Boolean(bookId),
  });

  const addReader = useMutation({
    mutationFn: (candidate: ReaderCandidate) =>
      apiJson<{ ok: true }>(
        `/api/books/${encodeURIComponent(bookId)}/readers`,
        {
          method: "POST",
          body: JSON.stringify({ userId: candidate.id }),
        },
      ),
    onSuccess: async (_result, candidate) => {
      toast.success(`${candidate.displayName} entrou nesta leitura`);
      setTerm("");
      setDebouncedTerm("");
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["books"], exact: false });
    },
    onError: (error) => {
      toast.error("Não foi possível adicionar o leitor", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    },
  });

  const { mutate, isPending, variables } = addReader;

  const onOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      setTerm("");
      setDebouncedTerm("");
    }
  }, []);

  const onTermChange = useCallback((value: string) => {
    setTerm(value);
  }, []);

  const openDialog = useCallback(() => {
    setOpen(true);
  }, []);

  const onSelect = useCallback(
    (candidate: ReaderCandidate) => {
      if (isPending) return;
      mutate(candidate);
    },
    [isPending, mutate],
  );

  const candidates = candidatesQuery.data?.candidates ?? [];
  const pendingUserId = isPending ? (variables?.id ?? null) : null;

  return useMemo(
    () => ({
      open,
      term,
      candidates,
      isSearching: shouldSearch && candidatesQuery.isFetching,
      shouldSearch,
      pendingUserId,
      onOpenChange,
      onTermChange,
      onSelect,
      openDialog,
    }),
    [
      candidates,
      candidatesQuery.isFetching,
      onOpenChange,
      onSelect,
      onTermChange,
      open,
      openDialog,
      pendingUserId,
      shouldSearch,
      term,
    ],
  );
}
