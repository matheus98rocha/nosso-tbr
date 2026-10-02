"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import BOOK_IMPORT_AI_PROMPT from "../services/bookImport/bookImportAiPrompt";

export default function useCopyBookImportPrompt() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;

    const timeoutId = window.setTimeout(() => {
      setCopied(false);
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  const copyPrompt = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(BOOK_IMPORT_AI_PROMPT);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }, []);

  return useMemo(
    () => ({
      copied,
      copyPrompt,
    }),
    [copied, copyPrompt],
  );
}
