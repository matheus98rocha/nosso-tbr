import { isPlaceholderBookCoverSrc } from "@/constants/bookCover";

import { FINISHED_BOOK_SHARE_LAYOUT } from "../../constants";
import type { FinishedBookShareSubject } from "../../types";

export type FinishedBookShareModel = {
  cardTitle: string;
  author: string | null;
  text: string;
  alt: string;
  filename: string;
  intentUrl: string;
};

const OPEN_QUOTE = "“";
const CLOSE_QUOTE = "”";
const ELLIPSIS = "…";

function codePoints(value: string): string[] {
  return Array.from(value);
}

function ellipsize(value: string, budget: number): string {
  const chars = codePoints(value);
  if (chars.length <= budget) return value;
  if (budget <= 1) return ELLIPSIS;
  return `${chars.slice(0, budget - 1).join("")}${ELLIPSIS}`;
}

function displayAuthor(author: string | null): string | null {
  const trimmed = author?.trim() ?? "";
  if (!trimmed || trimmed === FINISHED_BOOK_SHARE_LAYOUT.unknownAuthor) return null;
  return trimmed;
}

export function buildFinishedBookShareSubject(input: {
  bookId: string;
  title: string;
  author: string | null;
  imageUrl: string | null;
}): FinishedBookShareSubject {
  const imageTrimmed = input.imageUrl?.trim() ?? "";
  const imageUrl =
    imageTrimmed && !isPlaceholderBookCoverSrc(imageTrimmed) ? imageTrimmed : null;

  return {
    bookId: input.bookId,
    title: input.title.trim(),
    author: displayAuthor(input.author),
    imageUrl,
  };
}

function shareFilename(title: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug ? `${slug}.png` : FINISHED_BOOK_SHARE_LAYOUT.emptyFilename;
}

function shareText(title: string, author: string | null): string {
  const head = `Terminei de ler ${OPEN_QUOTE}`;
  const tail = author
    ? `${CLOSE_QUOTE}, de ${author}.`
    : `${CLOSE_QUOTE}.`;
  const full = `${head}${title}${tail}`;
  if (codePoints(full).length <= FINISHED_BOOK_SHARE_LAYOUT.textCodePointCap) {
    return full;
  }

  const titleBudget =
    FINISHED_BOOK_SHARE_LAYOUT.textCodePointCap -
    codePoints(head).length -
    codePoints(tail).length;
  if (titleBudget >= 1) {
    return `${head}${ellipsize(title, titleBudget)}${tail}`;
  }

  if (!author) {
    return `${head}${ELLIPSIS}${CLOSE_QUOTE}.`;
  }

  const between = `${CLOSE_QUOTE}, de `;
  const fixed =
    codePoints(head).length +
    codePoints(ELLIPSIS).length +
    codePoints(between).length +
    1;
  const authorBudget = FINISHED_BOOK_SHARE_LAYOUT.textCodePointCap - fixed;
  return `${head}${ELLIPSIS}${between}${ellipsize(author, Math.max(authorBudget, 1))}.`;
}

function altText(title: string, author: string | null): string {
  if (author) {
    return `Cartão de leitura de ${OPEN_QUOTE}${title}${CLOSE_QUOTE}, de ${author}. Leitura em 100%.`;
  }
  return `Cartão de leitura de ${OPEN_QUOTE}${title}${CLOSE_QUOTE}. Leitura em 100%.`;
}

export function buildTweetIntentUrl(text: string): string {
  return `${FINISHED_BOOK_SHARE_LAYOUT.intentUrl}?text=${encodeURIComponent(text)}`;
}

export function buildShareModel(
  subject: FinishedBookShareSubject,
): FinishedBookShareModel {
  const normalized = buildFinishedBookShareSubject(subject);
  const cardTitle = normalized.title || FINISHED_BOOK_SHARE_LAYOUT.emptyTitle;
  const author = normalized.author;
  const text = shareText(cardTitle, author);

  return {
    cardTitle,
    author,
    text,
    alt: altText(cardTitle, author),
    filename: shareFilename(normalized.title),
    intentUrl: buildTweetIntentUrl(text),
  };
}
