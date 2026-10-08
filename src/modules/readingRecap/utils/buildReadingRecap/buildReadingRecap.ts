import { isAllowedBookCoverUrl } from "@/constants/bookCover";
import { getGenderLabel } from "@/constants/genders";
import { DateUtils, getTodayInSaoPaulo } from "@/utils/date";

import type {
  BuildReadingRecapInput,
  RecapBook,
  RecapFilter,
  RecapImage,
  RecapPeriod,
  RecapPeriodKind,
} from "../../types";

export const RECAP_COVERS_PER_IMAGE = 15;

function civilDateFromEndDate(endDate: string): string | null {
  const date = DateUtils.toDate(endDate);
  if (!date) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function matchesPeriod(civilDate: string, period: RecapPeriod): boolean {
  const [year, month, day] = civilDate.split("-").map(Number);

  if (period.kind === "year") {
    return year === period.year;
  }

  if (period.kind === "month") {
    return year === period.year && month === period.month;
  }

  return (
    year === period.year && month === period.month && day === period.day
  );
}

export function formatRecapPeriodTitle(period: RecapPeriod): string {
  if (period.kind === "day" && period.month && period.day) {
    const date = DateUtils.createLocalDate(period.year, period.month, period.day);
    const formatted = new Intl.DateTimeFormat("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
    return `Leituras de ${formatted}`;
  }

  if (period.kind === "month" && period.month) {
    const date = DateUtils.createLocalDate(period.year, period.month, 1);
    const monthName = new Intl.DateTimeFormat("pt-BR", {
      month: "long",
    }).format(date);
    return `Leituras de ${monthName} de ${period.year}`;
  }

  return `Leituras do ano ${period.year}`;
}

function formatRecapTitle(
  period: RecapPeriod,
  page: number,
  totalPages: number,
): string {
  const base = formatRecapPeriodTitle(period);
  if (totalPages > 1) {
    return `${base} · ${page}/${totalPages}`;
  }
  return base;
}

export function recapPeriodToDate(period: RecapPeriod): Date {
  return DateUtils.createLocalDate(
    period.year,
    period.month ?? 1,
    period.day ?? 1,
  );
}

function formatRecapSubtitle(genders: string[]): string | null {
  if (genders.length === 0) return null;
  return genders.map((gender) => getGenderLabel(gender) ?? gender).join(" · ");
}

function resolveCoverSrc(
  imageUrl: string | null,
  placeholderSrc: string,
): string {
  const trimmed = imageUrl?.trim() ?? "";
  if (!trimmed || !isAllowedBookCoverUrl(trimmed)) {
    return placeholderSrc;
  }
  return trimmed;
}

function compareRecapBooks(left: RecapBook, right: RecapBook): number {
  const leftCivil = civilDateFromEndDate(left.endDate) ?? "";
  const rightCivil = civilDateFromEndDate(right.endDate) ?? "";
  if (leftCivil !== rightCivil) {
    return rightCivil.localeCompare(leftCivil);
  }
  return left.title.localeCompare(right.title, "pt-BR");
}

export function buildReadingRecap({
  books,
  filter,
  placeholderSrc,
}: BuildReadingRecapInput): RecapImage[] {
  const matched = books.filter((book) => {
    const civilDate = civilDateFromEndDate(book.endDate);
    if (!civilDate) return false;
    if (!matchesPeriod(civilDate, filter.period)) return false;
    if (filter.genders.length === 0) return true;
    if (!book.gender) return false;
    return filter.genders.includes(book.gender);
  });

  matched.sort(compareRecapBooks);

  if (matched.length === 0) return [];

  const pages: RecapBook[][] = [];
  for (let index = 0; index < matched.length; index += RECAP_COVERS_PER_IMAGE) {
    pages.push(matched.slice(index, index + RECAP_COVERS_PER_IMAGE));
  }

  const subtitle = formatRecapSubtitle(filter.genders);

  return pages.map((pageBooks, index) => ({
    title: formatRecapTitle(filter.period, index + 1, pages.length),
    subtitle,
    coverSrcs: pageBooks.map((pageBook) =>
      resolveCoverSrc(pageBook.imageUrl, placeholderSrc),
    ),
  }));
}

export function createDefaultRecapFilter(now: Date = new Date()): RecapFilter {
  const today = getTodayInSaoPaulo(now);
  return {
    period: {
      kind: "day",
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate(),
    },
    genders: [],
  };
}

export function applyRecapPeriodKind(
  current: RecapFilter,
  kind: RecapPeriodKind,
): RecapFilter {
  return {
    ...current,
    period: {
      ...current.period,
      kind,
    },
  };
}

export function applyRecapAnchorDate(
  current: RecapFilter,
  date: Date,
): RecapFilter {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const daysInMonth = new Date(year, month, 0).getDate();

  return {
    ...current,
    period: {
      ...current.period,
      year,
      month,
      day: Math.min(day, daysInMonth),
    },
  };
}

export function toRecapDownloadFilename(title: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || "recap-de-leitura"}.png`;
}
