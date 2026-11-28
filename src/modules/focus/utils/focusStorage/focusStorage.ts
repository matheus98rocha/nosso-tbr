import { FOCUS_STORAGE_PREFIX } from "../../constants/focusSession";
import type {
  FocusActiveSession,
  FocusMode,
  FocusPageProgress,
  FocusSession,
  FocusTimerStatus,
} from "../../types/focus.types";

const MODES: FocusMode[] = ["timer", "stopwatch"];
const STATUSES: FocusTimerStatus[] = ["idle", "running", "paused", "finished"];

function getStorageKey(userId: string, part: string): string {
  return `${FOCUS_STORAGE_PREFIX}:${part}:${userId}`;
}

function readJson(userId: string, part: string): unknown | null {
  if (typeof window === "undefined" || !userId) return null;

  try {
    const raw = window.localStorage.getItem(getStorageKey(userId, part));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(userId: string, part: string, value: unknown): void {
  if (typeof window === "undefined" || !userId) return;

  try {
    window.localStorage.setItem(
      getStorageKey(userId, part),
      JSON.stringify(value),
    );
  } catch {
    return;
  }
}

function removeJson(userId: string, part: string): void {
  if (typeof window === "undefined" || !userId) return;

  try {
    window.localStorage.removeItem(getStorageKey(userId, part));
  } catch {
    return;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function parseNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseActiveSession(value: unknown): FocusActiveSession | null {
  if (!isRecord(value)) return null;

  const mode = value.mode;
  const status = value.status;
  const durationSeconds = parseNumber(value.durationSeconds);
  const accumulatedSeconds = parseNumber(value.accumulatedSeconds);
  const updatedAt = parseString(value.updatedAt);

  if (
    !MODES.includes(mode as FocusMode) ||
    !STATUSES.includes(status as FocusTimerStatus) ||
    durationSeconds === null ||
    durationSeconds <= 0 ||
    accumulatedSeconds === null ||
    accumulatedSeconds < 0 ||
    !updatedAt
  ) {
    return null;
  }

  return {
    mode: mode as FocusMode,
    status: status as FocusTimerStatus,
    startedAt: parseString(value.startedAt),
    endsAt: parseString(value.endsAt),
    accumulatedSeconds,
    durationSeconds,
    selectedBookId: parseString(value.selectedBookId),
    goalPages: parseNumber(value.goalPages),
    muted: value.muted === true,
    updatedAt,
  };
}

function parseSession(value: unknown): FocusSession | null {
  if (!isRecord(value)) return null;

  const id = parseString(value.id);
  const startedAt = parseString(value.startedAt);
  const finishedAt = parseString(value.finishedAt);
  const durationSeconds = parseNumber(value.durationSeconds);
  const pagesRead = parseNumber(value.pagesRead);
  const mode = value.mode;

  if (
    !id ||
    !startedAt ||
    !finishedAt ||
    durationSeconds === null ||
    durationSeconds <= 0 ||
    pagesRead === null ||
    pagesRead < 0 ||
    !MODES.includes(mode as FocusMode)
  ) {
    return null;
  }

  return {
    id,
    startedAt,
    finishedAt,
    durationSeconds,
    mode: mode as FocusMode,
    bookId: parseString(value.bookId),
    goalPages: parseNumber(value.goalPages),
    pagesRead,
    finishedPage: parseNumber(value.finishedPage),
  };
}

function parseSessions(value: unknown): FocusSession[] {
  if (!Array.isArray(value)) return [];

  return value
    .map(parseSession)
    .filter((session): session is FocusSession => session !== null);
}

function parsePages(value: unknown): FocusPageProgress {
  if (!isRecord(value)) return {};

  return Object.entries(value).reduce<FocusPageProgress>((pages, [id, page]) => {
    const parsedPage = parseNumber(page);

    if (id && parsedPage !== null && parsedPage >= 0) {
      pages[id] = Math.floor(parsedPage);
    }

    return pages;
  }, {});
}

export function loadFocusActive(userId: string): FocusActiveSession | null {
  return parseActiveSession(readJson(userId, "active"));
}

export function saveFocusActive(
  userId: string,
  active: FocusActiveSession,
): void {
  writeJson(userId, "active", active);
}

export function clearFocusActive(userId: string): void {
  removeJson(userId, "active");
}

export function loadFocusSessions(userId: string): FocusSession[] {
  return parseSessions(readJson(userId, "sessions"));
}

export function appendFocusSession(
  userId: string,
  session: FocusSession,
): FocusSession[] {
  const sessions = loadFocusSessions(userId);
  const nextSessions = [...sessions.filter((item) => item.id !== session.id), session];

  writeJson(userId, "sessions", nextSessions);

  return nextSessions;
}

export function loadFocusPages(userId: string): FocusPageProgress {
  return parsePages(readJson(userId, "pages"));
}

export function saveFocusPage(
  userId: string,
  bookId: string,
  page: number,
): FocusPageProgress {
  const pages = { ...loadFocusPages(userId), [bookId]: Math.floor(page) };

  writeJson(userId, "pages", pages);

  return pages;
}
