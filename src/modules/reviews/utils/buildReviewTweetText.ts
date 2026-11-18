import { buildTweetIntentUrl } from "@/modules/finishedBookShare/utils";

import { X_TEXT_LIMIT } from "../constants";

const OPEN_QUOTE = "“";
const CLOSE_QUOTE = "”";
const ELLIPSIS = "…";

function codePoints(value: string) {
  return Array.from(value);
}

export function xWeightedLength(value: string) {
  return codePoints(value).reduce((total, char) => {
    const point = char.codePointAt(0) ?? 0;
    return total + (point > 0xffff ? 2 : 1);
  }, 0);
}

function ellipsize(value: string, budget: number) {
  const chars = codePoints(value);
  if (xWeightedLength(value) <= budget) return value;
  if (budget <= 1) return ELLIPSIS;
  let next = "";
  for (const char of chars) {
    const candidate = `${next}${char}`;
    if (xWeightedLength(`${candidate}${ELLIPSIS}`) > budget) break;
    next = candidate;
  }
  return `${next}${ELLIPSIS}`;
}

export function buildReviewTweetText(input: {
  title: string;
  author: string | null;
  content: string;
  readerName: string;
}) {
  const title = input.title.trim() || "um livro";
  const author = input.author?.trim() || null;
  const content = input.content.trim();
  const readerName = input.readerName.trim() || "um leitor";
  const tail = ` — ${readerName}`;
  const quoted = `${OPEN_QUOTE}${title}${CLOSE_QUOTE}`;
  const head = author
    ? `Resenha de ${quoted}, de ${author}: `
    : `Resenha de ${quoted}: `;
  const full = `${head}${content}${tail}`;

  if (xWeightedLength(full) <= X_TEXT_LIMIT) return full;

  const contentBudget =
    X_TEXT_LIMIT - xWeightedLength(head) - xWeightedLength(tail);
  if (contentBudget >= 1) {
    return `${head}${ellipsize(content, contentBudget)}${tail}`;
  }

  const fixedTail = author ? `, de ${author}: ${ELLIPSIS}${tail}` : `: ${ELLIPSIS}${tail}`;
  const titleBudget =
    X_TEXT_LIMIT -
    xWeightedLength(`Resenha de ${OPEN_QUOTE}`) -
    xWeightedLength(`${CLOSE_QUOTE}${fixedTail}`);

  return `Resenha de ${OPEN_QUOTE}${ellipsize(title, Math.max(titleBudget, 1))}${CLOSE_QUOTE}${fixedTail}`;
}

export function buildReviewIntentUrl(text: string) {
  return buildTweetIntentUrl(text);
}
