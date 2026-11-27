import {
  FOCUS_MAX_PAGES,
  FOCUS_MIN_PAGES,
} from "../../constants/focusSession";

export function normalizeFocusPages(
  value: number,
  maxPages = FOCUS_MAX_PAGES,
): number | null {
  if (!Number.isFinite(value)) return null;

  const pages = Math.round(value);
  const limit = Math.max(FOCUS_MIN_PAGES, Math.floor(maxPages));

  if (pages < FOCUS_MIN_PAGES || pages > limit) return null;

  return pages;
}
