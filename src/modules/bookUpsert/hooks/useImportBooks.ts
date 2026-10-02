"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import { QUERY_KEYS } from "@/constants/keys";

import type { BookImportResult } from "../components/bookImportPanel/bookImportPanel.types";

function isBookImportResult(value: unknown): value is BookImportResult {
  if (!value || typeof value !== "object") return false;

  const kind = (value as { kind?: unknown }).kind;
  return kind === "refused" || kind === "report";
}

type UseImportBooksParams = {
  isOpen: boolean;
  onImported?: () => void;
};

export default function useImportBooks({
  isOpen,
  onImported,
}: UseImportBooksParams) {
  const queryClient = useQueryClient();
  const [result, setResult] = useState<BookImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const reset = useCallback(() => {
    setResult(null);
  }, []);

  useEffect(() => {
    if (isOpen) return;

    setResult(null);
    setIsImporting(false);
  }, [isOpen]);

  const importFile = useCallback(
    async (file: File) => {
      setIsImporting(true);
      setResult(null);

      try {
        const body = new FormData();
        body.set("file", file);
        const response = await fetch("/api/books/import", {
          method: "POST",
          body,
        });
        const payload: unknown = await response.json();

        if (!response.ok || !isBookImportResult(payload)) {
          const message =
            payload &&
            typeof payload === "object" &&
            "message" in payload &&
            typeof payload.message === "string"
              ? payload.message
              : "Não foi possível importar agora.";

          setResult({ kind: "refused", message });
          return;
        }

        setResult(payload);

        if (payload.kind === "report" && payload.createdCount > 0) {
          await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.books.all });
          await queryClient.invalidateQueries({ queryKey: ["authors"] });

          if (payload.rejectedCount === 0) {
            onImported?.();
          }
        }
      } catch {
        setResult({
          kind: "refused",
          message: "Não foi possível importar agora.",
        });
      } finally {
        setIsImporting(false);
      }
    },
    [onImported, queryClient],
  );

  return useMemo(
    () => ({
      importFile,
      isImporting,
      reset,
      result,
    }),
    [importFile, isImporting, reset, result],
  );
}
