import type { BookCreateValidator, BookDomain } from "@/types/books.types";

export function buildNextReadingStartPayload(
  book: BookDomain & { id: string },
): BookCreateValidator {
  return {
    title: book.title,
    pages: book.pages,
    readers: [...book.readerIds],
    chosen_by: book.chosen_by,
    user_id: book.user_id,
    author_id: book.authorId ?? "",
    start_date: book.start_date ?? new Date().toISOString(),
    end_date: null,
    planned_start_date: null,
    gender: book.gender ?? "",
    image_url: book.image_url ?? "",
    status: "reading",
    is_reread: book.is_reread,
  };
}
