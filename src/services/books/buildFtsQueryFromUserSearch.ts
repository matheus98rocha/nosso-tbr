import { PORTUGUESE_STOP_WORDS } from "@/utils/normalizeForBookTitleSearch";
import { stripLatinDiacritics } from "@/utils/stripLatinDiacritics";

export function buildFtsQueryFromUserSearch(
  searchTerm: string | undefined,
): string | null {
  if (!searchTerm?.trim()) return null;
  const cleanTerm = searchTerm.replace(/[^\w\sÀ-ÿ]/g, " ").trim();
  const words = cleanTerm
    .split(/\s+/)
    .map((word) => stripLatinDiacritics(word).toLowerCase())
    .filter((word) => word.length >= 1)
    .filter((word) => !PORTUGUESE_STOP_WORDS.has(word));
  if (words.length === 0) return null;
  return words.join(" ");
}
