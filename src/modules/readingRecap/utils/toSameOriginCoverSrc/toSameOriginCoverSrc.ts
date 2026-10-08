import {
  BOOK_COVER_PLACEHOLDER_SRC,
  isAllowedBookCoverUrl,
} from "@/constants/bookCover";

export function toSameOriginCoverSrc(src: string): string {
  const trimmed = src.trim();
  if (!trimmed) return BOOK_COVER_PLACEHOLDER_SRC;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  if (!isAllowedBookCoverUrl(trimmed)) return BOOK_COVER_PLACEHOLDER_SRC;
  return `/api/book-covers?url=${encodeURIComponent(trimmed)}`;
}
