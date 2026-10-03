import type { BookDomain, Status } from "@/types/books.types";

import type {
  BookDetailsInsight,
  BookDetailsTimelineItem,
} from "../types/bookCardDetailsModal.types";

export const BOOK_COMFORT_PAGES_PER_DAY = 30;

type InsightBook = Pick<
  BookDomain,
  "pages" | "status" | "start_date" | "end_date" | "planned_start_date"
>;

type TimelineBook = Pick<
  BookDomain,
  "planned_start_date" | "start_date" | "end_date" | "status"
>;

const WAITING_STATUSES = new Set<Status>(["planned", "not_started"]);
const ACTIVE_STATUSES = new Set<Status>([
  "reading",
  "paused",
  "finished",
  "abandoned",
]);

function parseCalendarDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }
    return date;
  }

  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function calendarDaysBetween(start: Date, end: Date): number {
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((endUtc - startUtc) / 86_400_000);
}

function formatDaySpan(days: number): string {
  if (days === 1) return "1 dia";
  return `${days.toLocaleString("pt-BR")} dias`;
}

function formatPace(pages: number, days: number): string {
  const pace = pages / days;
  const rounded = pace >= 10 ? Math.round(pace) : Math.round(pace * 10) / 10;
  const text = rounded.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  return `${text} pág./dia`;
}

export function formatBookCalendarDate(
  iso: string | null | undefined,
): string | null {
  if (!iso) return null;
  const date = parseCalendarDate(iso);
  if (!date) return null;
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function buildBookReference(book: {
  title: string;
  author: string;
  pages: number;
}): string {
  if (book.pages > 0) {
    return `${book.title} — ${book.author} · ${book.pages.toLocaleString("pt-BR")} pág.`;
  }
  return `${book.title} — ${book.author}`;
}

export function splitReaderLabels(display: string): string[] {
  const trimmed = display.trim();
  if (!trimmed) return [];

  const commaParts = trimmed.split(", ");
  if (commaParts.length === 1) {
    const pair = trimmed.split(" e ");
    if (pair.length === 2) {
      return pair.map((part) => part.trim()).filter(Boolean);
    }
    return [trimmed];
  }

  const last = commaParts[commaParts.length - 1] ?? "";
  const tail = last.split(" e ");
  return [...commaParts.slice(0, -1), ...tail]
    .map((part) => part.trim())
    .filter(Boolean);
}

function pushCountdown(
  insights: BookDetailsInsight[],
  plannedIso: string,
  now: Date,
) {
  const planned = parseCalendarDate(plannedIso);
  if (!planned) return;

  const daysUntil = calendarDaysBetween(now, planned);
  if (daysUntil > 1) {
    insights.push({
      id: "countdown",
      label: "Início",
      value: `Em ${daysUntil} dias`,
      hint: "data planejada",
    });
    return;
  }
  if (daysUntil === 1) {
    insights.push({
      id: "countdown",
      label: "Início",
      value: "Amanhã",
      hint: "data planejada",
    });
    return;
  }
  if (daysUntil === 0) {
    insights.push({
      id: "countdown",
      label: "Início",
      value: "Hoje",
      hint: "data planejada",
    });
    return;
  }
  if (daysUntil === -1) {
    insights.push({
      id: "delay",
      label: "Atraso",
      value: "há 1 dia",
      hint: "início previsto",
    });
    return;
  }
  insights.push({
    id: "delay",
    label: "Atraso",
    value: `há ${Math.abs(daysUntil).toLocaleString("pt-BR")} dias`,
    hint: "início previsto",
  });
}

function durationCopy(status: Status | undefined): { label: string; hint: string } {
  if (status === "finished") {
    return { label: "Duração", hint: "do início ao fim" };
  }
  if (status === "paused") {
    return { label: "No calendário", hint: "desde o início" };
  }
  if (status === "abandoned") {
    return { label: "Percurso", hint: "até interromper" };
  }
  return { label: "Em leitura", hint: "desde o início" };
}

export function buildBookReadingInsights(
  book: InsightBook,
  now: Date,
): BookDetailsInsight[] {
  const insights: BookDetailsInsight[] = [];
  const status = book.status;

  if (book.pages > 0) {
    insights.push({
      id: "pages",
      label: "Páginas",
      value: book.pages.toLocaleString("pt-BR"),
      hint: "do volume",
    });
  }

  const waiting = !status || WAITING_STATUSES.has(status);
  if (waiting && book.planned_start_date) {
    pushCountdown(insights, book.planned_start_date, now);
  }

  const started = status ? ACTIVE_STATUSES.has(status) : false;
  const start = book.start_date ? parseCalendarDate(book.start_date) : null;
  const explicitEnd = book.end_date ? parseCalendarDate(book.end_date) : null;
  const end =
    explicitEnd ??
    (status === "reading" || status === "paused" || status === "abandoned"
      ? now
      : null);

  let paceDays: number | null = null;
  if (started && start && end) {
    const span = calendarDaysBetween(start, end);
    if (span >= 0) {
      paceDays = span + 1;
      const copy = durationCopy(status);
      insights.push({
        id: "duration",
        label: copy.label,
        value: formatDaySpan(paceDays),
        hint: copy.hint,
      });
    }
  }

  if (paceDays && book.pages > 0) {
    insights.push({
      id: "pace",
      label: "Ritmo",
      value: formatPace(book.pages, paceDays),
      hint: "média nesta leitura",
    });
  }

  const hasPace = paceDays !== null && book.pages > 0;
  const canForecast =
    book.pages > 0 &&
    !hasPace &&
    status !== "finished" &&
    status !== "abandoned";

  if (canForecast) {
    const days = Math.max(
      1,
      Math.ceil(book.pages / BOOK_COMFORT_PAGES_PER_DAY),
    );
    insights.push({
      id: "forecast",
      label: "Previsão",
      value: formatDaySpan(days),
      hint: `${BOOK_COMFORT_PAGES_PER_DAY} pág./dia`,
    });
  }

  return insights;
}

export function buildBookTimeline(book: TimelineBook): BookDetailsTimelineItem[] {
  const items: BookDetailsTimelineItem[] = [];
  const planned = formatBookCalendarDate(book.planned_start_date);
  const start = formatBookCalendarDate(book.start_date);
  const end = formatBookCalendarDate(book.end_date);

  if (planned) {
    items.push({
      id: "planned",
      label: "Início planejado",
      value: planned,
    });
  }
  if (start) {
    items.push({
      id: "start",
      label: "Leitura iniciada",
      value: start,
    });
  }
  if (end) {
    items.push({
      id: "end",
      label: book.status === "finished" ? "Concluído em" : "Encerrado em",
      value: end,
    });
  }

  return items;
}
