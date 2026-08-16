import { DateUtils } from "@/utils/date";

import type {
  SchedulePaceAggregatesInput,
  SchedulePaceDomain,
  SchedulePaceRow,
  SchedulePaceStatus,
} from "../types/schedulePace.types";
import { addCalendarDays } from "./addCalendarDays";

function startOfCalendarDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12,
    0,
    0,
    0,
  );
}

function resolveRowDate(value: Date | string): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : startOfCalendarDay(value);
  }

  const iso = DateUtils.ptBRToISO(value);
  const fromIso = DateUtils.toDate(iso);
  if (fromIso) {
    return startOfCalendarDay(fromIso);
  }

  const fallback = DateUtils.toDate(value);
  return fallback ? startOfCalendarDay(fallback) : null;
}

function buildPace(
  overdueDays: number,
  aheadDays: number,
  plannedEndDate: Date,
): SchedulePaceDomain {
  const status: SchedulePaceStatus =
    overdueDays > 0 ? "behind" : aheadDays > 0 ? "ahead" : "on_time";

  return {
    status,
    overdueDays,
    aheadDays,
    plannedEndDate,
    predictedEndDate: addCalendarDays(plannedEndDate, overdueDays - aheadDays),
  };
}

export function computeSchedulePace(
  rows: readonly SchedulePaceRow[] | null | undefined,
  today: Date,
): SchedulePaceDomain | null {
  if (!rows || rows.length === 0) {
    return null;
  }

  const todayDay = startOfCalendarDay(today);
  const todayTime = todayDay.getTime();

  let overdueDays = 0;
  let aheadDays = 0;
  let lastDate: Date | null = null;

  for (const row of rows) {
    const date = resolveRowDate(row.date);
    if (!date) {
      continue;
    }

    if (!lastDate || date.getTime() > lastDate.getTime()) {
      lastDate = date;
    }

    if (date.getTime() <= todayTime && !row.completed) {
      overdueDays += 1;
    }

    if (date.getTime() > todayTime && row.completed) {
      aheadDays += 1;
    }
  }

  if (!lastDate) {
    return null;
  }

  return buildPace(overdueDays, aheadDays, lastDate);
}

export function computeSchedulePaceFromAggregates(
  input: SchedulePaceAggregatesInput | null | undefined,
): SchedulePaceDomain | null {
  if (!input || input.lastDate === undefined || input.lastDate === "") {
    return null;
  }

  if (input.overdue === undefined || input.ahead === undefined) {
    return null;
  }

  if (!Number.isFinite(input.overdue) || !Number.isFinite(input.ahead)) {
    return null;
  }

  const plannedEndDate = resolveRowDate(input.lastDate);
  if (!plannedEndDate) {
    return null;
  }

  const overdueDays = Math.max(0, input.overdue);
  const aheadDays = Math.max(0, input.ahead);

  return buildPace(overdueDays, aheadDays, plannedEndDate);
}
