import type { BookDomain } from "@/types/books.types";

export function bookAuthorIdsFromDomain(
  book: Pick<BookDomain, "authorIds" | "authorId">,
): string[] {
  if (book.authorIds?.length) {
    return [...book.authorIds];
  }
  if (book.authorId) {
    return [book.authorId];
  }
  return [];
}
