"use client";

import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { QUERY_KEYS } from "@/constants/keys";
import { BookUpsertService } from "@/modules/bookUpsert/services/bookUpsert.service";

import type {
  FocusSession,
  FocusSummaryInput,
} from "../../types/focus.types";
import { buildFocusFinishedBookPayload } from "../../utils/buildFocusFinishedBookPayload";
import { computeFocusSpeed, suggestFinishPage } from "../../utils/focusEstimates";

const bookUpsertService = new BookUpsertService();

function createSessionId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `focus-${Date.now()}`;
}

type UseFocusSessionRecorderOptions = {
  sessions: readonly FocusSession[];
  addSession: (session: FocusSession) => void;
  savePage: (bookId: string, page: number) => void;
};

export function useFocusSessionRecorder({
  sessions,
  addSession,
  savePage,
}: UseFocusSessionRecorderOptions) {
  const queryClient = useQueryClient();
  const [summary, setSummary] = useState<FocusSummaryInput | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const speed = useMemo(() => computeFocusSpeed(sessions), [sessions]);

  const suggestedPage = useMemo(() => {
    if (!summary) return 0;

    if (!summary.book) {
      return Math.max(0, summary.goalPages ?? summary.estimatedPages);
    }

    return suggestFinishPage(
      summary.book.currentPage,
      summary.goalPages,
      summary.estimatedPages,
      summary.book.pages,
    );
  }, [summary]);

  const openSummary = useCallback((input: FocusSummaryInput) => {
    setSummary(input);
  }, []);

  const closeSummary = useCallback(() => {
    setSummary(null);
  }, []);

  const confirmSummary = useCallback(
    async (page: number) => {
      if (!summary || !Number.isFinite(page)) return;

      const book = summary.book;
      const currentPage = book?.currentPage ?? 0;
      const maxPage = book?.pages ?? Number.MAX_SAFE_INTEGER;
      const finalPage = Math.max(
        currentPage,
        Math.min(maxPage, Math.round(page)),
      );
      const pagesRead = book
        ? finalPage - currentPage
        : Math.max(0, Math.round(page));

      const session: FocusSession = {
        id: createSessionId(),
        startedAt: summary.startedAt,
        finishedAt: summary.finishedAt,
        durationSeconds: Math.max(1, Math.round(summary.durationSeconds)),
        mode: summary.mode,
        bookId: book?.id ?? null,
        goalPages: summary.goalPages,
        pagesRead,
        finishedPage: book ? finalPage : null,
      };

      addSession(session);

      if (book) {
        savePage(book.id, finalPage);

        if (finalPage >= book.pages && book.status === "reading") {
          setIsSaving(true);

          try {
            await bookUpsertService.edit(
              book.id,
              buildFocusFinishedBookPayload(book),
            );
            await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.books.all });
            toast.success("Leitura finalizada. Sua sessão foi registrada.");
          } catch {
            toast.error("Sessão registrada, mas não foi possível finalizar o livro.");
          } finally {
            setIsSaving(false);
          }
        }
      }

      setSummary(null);
    },
    [addSession, queryClient, savePage, summary],
  );

  return {
    summary,
    suggestedPage,
    speed,
    isSaving,
    openSummary,
    closeSummary,
    confirmSummary,
  };
}
