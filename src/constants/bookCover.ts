export const BOOK_COVER_PLACEHOLDER_SRC = "/book-cover-placeholder.svg" as const;

export function resolveBookCoverUrl(
  url: string | undefined | null,
): string {
  const trimmed = typeof url === "string" ? url.trim() : "";
  if (!trimmed) {
    return BOOK_COVER_PLACEHOLDER_SRC;
  }
  return trimmed;
}
