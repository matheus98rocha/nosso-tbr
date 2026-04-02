import { stripLatinDiacritics } from "@/utils/stripLatinDiacritics";
import { PORTUGUESE_STOP_WORDS } from "./portugueseStopWords";

export function normalizeForBookTitleSearch(raw: string): string {
  const folded = stripLatinDiacritics(raw.trim().toLowerCase());
  const withSpaces = folded.replace(/[^\p{L}\p{N}]+/gu, " ");
  const tokens = withSpaces.split(/\s+/).filter(Boolean);
  const contentTokens = tokens.filter((token) => !PORTUGUESE_STOP_WORDS.has(token));
  return contentTokens.join(" ");
}
