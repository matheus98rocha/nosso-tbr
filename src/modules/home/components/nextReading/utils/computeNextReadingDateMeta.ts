import { getTodayInSaoPaulo } from "@/modules/schedule/utils/getTodayInSaoPaulo";
import { DateUtils } from "@/utils/date";

import type { NextReadingDateMeta } from "../nextReading.types";

function startOfLocalDay(date: Date): Date {
  return DateUtils.createLocalDate(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
}

function formatShortStartDate(date: Date): string {
  const formatted = date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
  });

  return formatted.replace(".", "").replace(/\s+/g, " ").trim();
}

function buildRelativeLabel(daysUntilStart: number): string {
  if (daysUntilStart === 0) {
    return "Hoje";
  }

  if (daysUntilStart === 1) {
    return "Em 1 dia";
  }

  if (daysUntilStart > 1) {
    return `Em ${daysUntilStart} dias`;
  }

  const overdueDays = Math.abs(daysUntilStart);
  if (overdueDays === 1) {
    return "Atrasado 1 dia";
  }

  return `Atrasado ${overdueDays} dias`;
}

export function computeNextReadingDateMeta(
  plannedStartDate: string | null | undefined,
  now: Date = new Date(),
): NextReadingDateMeta {
  const empty: NextReadingDateMeta = {
    daysUntilStart: null,
    isStartOverdue: false,
    isToday: false,
    relativeLabel: "",
    formattedStartDate: "",
  };

  if (!plannedStartDate) {
    return empty;
  }

  const planned = DateUtils.toDate(plannedStartDate);
  if (!planned) {
    return empty;
  }

  const today = startOfLocalDay(getTodayInSaoPaulo(now));
  const plannedDay = startOfLocalDay(planned);
  const diffMs = plannedDay.getTime() - today.getTime();
  const daysUntilStart = Math.round(diffMs / (1000 * 60 * 60 * 24));

  return {
    daysUntilStart,
    isStartOverdue: daysUntilStart < 0,
    isToday: daysUntilStart === 0,
    relativeLabel: buildRelativeLabel(daysUntilStart),
    formattedStartDate: formatShortStartDate(plannedDay),
  };
}
