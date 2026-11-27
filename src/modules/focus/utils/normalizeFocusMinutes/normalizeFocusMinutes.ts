import {
  FOCUS_MAX_MINUTES,
  FOCUS_MIN_MINUTES,
} from "../../constants/focusTimer";

export function normalizeFocusMinutes(value: number): number | null {
  if (!Number.isFinite(value)) return null;

  const minutes = Math.round(value);

  if (minutes < FOCUS_MIN_MINUTES || minutes > FOCUS_MAX_MINUTES) return null;

  return minutes;
}
