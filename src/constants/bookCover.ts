export const BOOK_COVER_PLACEHOLDER_SRC = "/book-cover-placeholder.svg" as const;

function isLocalBookCoverSrc(url: string): boolean {
  return url.startsWith("/");
}

export function isAllowedBookCoverUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (isLocalBookCoverSrc(trimmed)) return true;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") return false;

    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === "m.media-amazon.com" ||
      hostname === "books.google.com" ||
      hostname === "covers.openlibrary.org"
    ) {
      return true;
    }

    if (
      hostname.endsWith(".media-amazon.com") ||
      hostname.endsWith(".ssl-images-amazon.com")
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export function resolveBookCoverUrl(
  url: string | undefined | null,
): string {
  const trimmed = typeof url === "string" ? url.trim() : "";
  if (!trimmed || !isAllowedBookCoverUrl(trimmed)) {
    return BOOK_COVER_PLACEHOLDER_SRC;
  }
  return trimmed;
}
