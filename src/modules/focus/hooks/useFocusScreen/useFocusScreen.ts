"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useUserStore } from "@/stores/userStore";

import {
  FOCUS_MAX_PAGES,
  FOCUS_MIN_PAGES,
  FOCUS_MIN_VALID_SESSION_SECONDS,
} from "../../constants/focusSession";
import type { FocusActiveSession, FocusMode } from "../../types/focus.types";
import type { FocusScreenViewModel } from "../../types/focus.components.types";
import { estimateFocusPages } from "../../utils/focusEstimates";
import { normalizeFocusPages } from "../../utils/normalizeFocusPages";
import { useFocusBooks } from "../useFocusBooks";
import { useFocusEstimates } from "../useFocusEstimates";
import { useFocusSessionRecorder } from "../useFocusSessionRecorder";
import { useFocusSound } from "../useFocusSound";
import { useFocusStorage } from "../useFocusStorage";
import { useFocusTimer } from "../useFocusTimer";

export function useFocusScreen(): FocusScreenViewModel {
  const userId = useUserStore((state) => state.user?.id);
  const {
    active,
    sessions,
    pages,
    isReady,
    persistActive,
    discardActive,
    addSession,
    savePage,
  } = useFocusStorage(userId);
  const {
    muted,
    unlock: unlockSound,
    play: playSound,
    setMuted: setSoundMuted,
  } = useFocusSound(active?.muted ?? false);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [goalPages, setGoalPages] = useState<number | null>(null);
  const [goalInput, setGoalInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const hydratedRef = useRef(false);
  const skipPersistRef = useRef(true);
  const pendingSummaryRef = useRef<FocusActiveSession | null>(null);
  const timerRef = useRef<ReturnType<typeof useFocusTimer> | null>(null);
  const buildSummaryRef = useRef<(seconds?: number) => void>(() => undefined);

  const { books, isLoading: booksLoading, isError: booksError } = useFocusBooks(
    pages,
  );

  const selectedBook = useMemo(
    () => books.find((book) => book.id === selectedBookId) ?? null,
    [books, selectedBookId],
  );

  const {
    summary,
    suggestedPage,
    isSaving,
    openSummary,
    closeSummary,
    confirmSummary,
  } = useFocusSessionRecorder({ sessions, addSession, savePage });

  const durationMinutes = timerRef.current
    ? timerRef.current.durationSeconds / 60
    : 25;
  const estimates = useFocusEstimates({
    sessions,
    book: selectedBook,
    goalPages,
    durationMinutes,
  });

  buildSummaryRef.current = (secondsOverride) => {
    const elapsedSeconds =
      secondsOverride ??
      timerRef.current?.elapsedSeconds ??
      FOCUS_MIN_VALID_SESSION_SECONDS;
    const durationSeconds = Math.max(1, Math.round(elapsedSeconds));
    const now = new Date().toISOString();

    openSummary({
      startedAt: timerRef.current?.startedAt ?? now,
      finishedAt: now,
      durationSeconds,
      mode: timerRef.current?.mode ?? "timer",
      book: selectedBook,
      goalPages,
      estimatedPages: estimateFocusPages(durationSeconds / 60, estimates.speed),
    });
  };

  const handleTimerFinish = useCallback(() => {
    playSound();
    buildSummaryRef.current();
  }, [playSound]);

  const timer = useFocusTimer({ onFinish: handleTimerFinish });
  const {
    start: startTimer,
    pause: pauseTimer,
    reset: resetTimer,
    finish: finishTimer,
    setDurationMinutes,
    setMode,
    restore: restoreTimer,
  } = timer;
  timerRef.current = timer;

  useEffect(() => {
    if (!isReady || hydratedRef.current) return;

    hydratedRef.current = true;

    if (!active) return;

    setSoundMuted(active.muted);
    setSelectedBookId(active.selectedBookId);
    setGoalPages(active.goalPages);
    setGoalInput(active.goalPages === null ? "" : String(active.goalPages));
    restoreTimer(active);

    if (active.status === "finished") {
      pendingSummaryRef.current = active;
    }
  }, [isReady, active, setSoundMuted, restoreTimer]);

  useEffect(() => {
    const pending = pendingSummaryRef.current;

    if (!pending || booksLoading) return;

    const book = books.find((item) => item.id === pending.selectedBookId) ?? null;

    openSummary({
      startedAt: pending.startedAt ?? pending.updatedAt,
      finishedAt: pending.updatedAt,
      durationSeconds: Math.max(1, Math.round(pending.durationSeconds)),
      mode: pending.mode,
      book,
      goalPages: pending.goalPages,
      estimatedPages: estimateFocusPages(
        pending.durationSeconds / 60,
        estimates.speed,
      ),
    });
    pendingSummaryRef.current = null;
  }, [books, booksLoading, estimates.speed, openSummary]);

  useEffect(() => {
    if (!userId || !isReady || !hydratedRef.current) return;

    if (skipPersistRef.current) {
      skipPersistRef.current = false;
      return;
    }

    if (timer.status === "idle" && selectedBookId === null && goalPages === null) {
      discardActive();
      return;
    }

    persistActive({
      mode: timer.mode,
      status: timer.status,
      startedAt: timer.startedAt,
      endsAt: timer.endsAt,
      accumulatedSeconds: timer.accumulatedSeconds,
      durationSeconds: timer.durationSeconds,
      selectedBookId,
      goalPages,
      muted,
      updatedAt: new Date().toISOString(),
    });
  }, [
    userId,
    isReady,
    persistActive,
    discardActive,
    timer.mode,
    timer.status,
    timer.startedAt,
    timer.endsAt,
    timer.accumulatedSeconds,
    timer.durationSeconds,
    selectedBookId,
    goalPages,
    muted,
  ]);

  const commitGoal = useCallback(
    (value: string) => {
      const trimmed = value.trim().replace(",", ".");

      if (!trimmed) {
        setGoalPages(null);
        setGoalInput("");
        setInputError(null);
        return;
      }

      const pages = normalizeFocusPages(
        Number(trimmed),
        selectedBook ? selectedBook.pages : FOCUS_MAX_PAGES,
      );

      if (pages === null) {
        setInputError(
          `Informe entre ${FOCUS_MIN_PAGES} e ${selectedBook?.pages ?? FOCUS_MAX_PAGES} páginas.`,
        );
        return;
      }

      setGoalPages(pages);
      setGoalInput(String(pages));
      setInputError(null);
    },
    [selectedBook],
  );

  const handleGoalInputChange = useCallback((value: string) => {
    setGoalInput(value);
    setInputError(null);

    if (!value.trim()) {
      setGoalPages(null);
    }
  }, []);

  const handleGoalPreset = useCallback(
    (pages: number) => {
      commitGoal(String(pages));
    },
    [commitGoal],
  );

  const handleGoalClear = useCallback(() => {
    setGoalPages(null);
    setGoalInput("");
    setInputError(null);
  }, []);

  const handleAcceptSuggestion = useCallback(() => {
    if (estimates.suggestedMinutes === null) return;

    setDurationMinutes(estimates.suggestedMinutes);
  }, [estimates.suggestedMinutes, setDurationMinutes]);

  const handleDurationChange = useCallback(
    (minutes: number) => {
      setDurationMinutes(minutes);
    },
    [setDurationMinutes],
  );

  const handleModeChange = useCallback(
    (mode: FocusMode) => {
      setMode(mode);
    },
    [setMode],
  );

  const handleBookChange = useCallback(
    (bookId: string | null) => {
      setSelectedBookId(bookId);
      setInputError(null);

      if (bookId === null) {
        setGoalPages(null);
        setGoalInput("");
        return;
      }

      const book = books.find((item) => item.id === bookId);

      if (book && goalPages !== null && goalPages > book.pages) {
        setGoalPages(book.pages);
        setGoalInput(String(book.pages));
      }
    },
    [books, goalPages],
  );

  const handleToggleMute = useCallback(() => {
    if (muted) {
      setSoundMuted(false);
      unlockSound(true);
      return;
    }

    setSoundMuted(true);
  }, [muted, setSoundMuted, unlockSound]);

  const handleStart = useCallback(() => {
    unlockSound();
    startTimer();
  }, [unlockSound, startTimer]);

  const handleReset = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  const clearSessionState = useCallback(() => {
    discardActive();
    resetTimer();
  }, [discardActive, resetTimer]);

  const handleConfirmSummary = useCallback(
    async (page: number) => {
      await confirmSummary(page);
      clearSessionState();
    },
    [confirmSummary, clearSessionState],
  );

  const handleCancelSummary = useCallback(() => {
    closeSummary();
    clearSessionState();
  }, [closeSummary, clearSessionState]);

  const handleFinishSession = useCallback(() => {
    const seconds = finishTimer();

    if (seconds < FOCUS_MIN_VALID_SESSION_SECONDS) {
      resetTimer();
      return;
    }

    buildSummaryRef.current(seconds);
  }, [finishTimer, resetTimer]);

  const canFinish =
    (timer.status === "running" || timer.status === "paused") &&
    timer.elapsedSeconds >= FOCUS_MIN_VALID_SESSION_SECONDS;

  return {
    mode: timer.mode,
    status: timer.status,
    displaySeconds: timer.displaySeconds,
    progress: timer.progress,
    durationMinutes: timer.durationSeconds / 60,
    goalPages,
    estimatedPages: estimates.estimatedPages,
    remainingMinutes: estimates.remainingMinutes,
    suggestedMinutes: estimates.suggestedMinutes,
    speed: estimates.speed,
    book: selectedBook,
    books,
    booksLoading,
    booksError,
    goalInput,
    inputError,
    muted,
    canFinish,
    onModeChange: handleModeChange,
    onBookChange: handleBookChange,
    onGoalInputChange: handleGoalInputChange,
    onGoalSubmit: () => commitGoal(goalInput),
    onGoalPreset: handleGoalPreset,
    onGoalClear: handleGoalClear,
    onAcceptSuggestion: handleAcceptSuggestion,
    onDurationChange: handleDurationChange,
    onToggleMute: handleToggleMute,
    onStart: handleStart,
    onPause: pauseTimer,
    onReset: handleReset,
    onFinishSession: handleFinishSession,
    summary,
    suggestedPage,
    isSaving,
    onConfirmSummary: handleConfirmSummary,
    onCancelSummary: handleCancelSummary,
  };
}
