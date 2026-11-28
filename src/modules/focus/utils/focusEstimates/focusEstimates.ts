import {
  FOCUS_DEFAULT_SPEED,
  FOCUS_MIN_SESSIONS_FOR_SPEED,
} from "../../constants/focusSession";
import type { FocusSession } from "../../types/focus.types";
import { normalizeFocusMinutes } from "../normalizeFocusMinutes";
import { normalizeFocusPages } from "../normalizeFocusPages";

export function computeFocusSpeed(sessions: readonly FocusSession[]): number {
  const concluded = sessions.filter(
    (session) => session.pagesRead > 0 && session.durationSeconds > 0,
  );

  if (concluded.length < FOCUS_MIN_SESSIONS_FOR_SPEED) {
    return FOCUS_DEFAULT_SPEED;
  }

  const pages = concluded.reduce((total, session) => total + session.pagesRead, 0);
  const minutes = concluded.reduce(
    (total, session) => total + session.durationSeconds / 60,
    0,
  );

  if (pages <= 0 || minutes <= 0) return FOCUS_DEFAULT_SPEED;

  const speed = pages / minutes;

  return Number.isFinite(speed) && speed > 0 ? speed : FOCUS_DEFAULT_SPEED;
}

export function suggestFocusMinutes(pages: number, speed: number): number | null {
  const normalizedPages = normalizeFocusPages(pages);

  if (normalizedPages === null || !Number.isFinite(speed) || speed <= 0) {
    return null;
  }

  return normalizeFocusMinutes(Math.ceil(normalizedPages / speed));
}

export function estimateFocusPages(minutes: number, speed: number): number {
  if (!Number.isFinite(minutes) || !Number.isFinite(speed) || speed <= 0) {
    return 0;
  }

  return Math.max(0, Math.floor(minutes * speed));
}

export function estimateBookRemainingMinutes(
  currentPage: number,
  totalPages: number,
  speed: number,
): number {
  if (
    !Number.isFinite(currentPage) ||
    !Number.isFinite(totalPages) ||
    !Number.isFinite(speed) ||
    speed <= 0
  ) {
    return 0;
  }

  return Math.max(0, (totalPages - currentPage) / speed);
}

export function suggestFinishPage(
  currentPage: number,
  goalPages: number | null,
  estimatedPages: number,
  totalPages: number,
): number {
  const planned = goalPages ?? estimatedPages;
  const nextPage = Math.max(0, currentPage) + Math.max(0, planned);

  return Math.max(0, Math.min(Math.floor(totalPages), Math.floor(nextPage)));
}
