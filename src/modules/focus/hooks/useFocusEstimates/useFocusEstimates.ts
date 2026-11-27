"use client";

import { useMemo } from "react";

import type { FocusBook, FocusSession } from "../../types/focus.types";
import {
  computeFocusSpeed,
  estimateBookRemainingMinutes,
  estimateFocusPages,
  suggestFocusMinutes,
} from "../../utils/focusEstimates";

type UseFocusEstimatesOptions = {
  sessions: readonly FocusSession[];
  book: FocusBook | null;
  goalPages: number | null;
  durationMinutes: number;
};

export function useFocusEstimates({
  sessions,
  book,
  goalPages,
  durationMinutes,
}: UseFocusEstimatesOptions) {
  const speed = useMemo(() => computeFocusSpeed(sessions), [sessions]);

  const suggestedMinutes = useMemo(
    () => (goalPages === null ? null : suggestFocusMinutes(goalPages, speed)),
    [goalPages, speed],
  );

  const estimatedPages = useMemo(
    () => estimateFocusPages(durationMinutes, speed),
    [durationMinutes, speed],
  );

  const remainingMinutes = useMemo(
    () =>
      book ? estimateBookRemainingMinutes(book.currentPage, book.pages, speed) : null,
    [book, speed],
  );

  return { speed, suggestedMinutes, estimatedPages, remainingMinutes };
}
