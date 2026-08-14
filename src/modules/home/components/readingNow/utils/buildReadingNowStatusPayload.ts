import type { BookCreateValidator, BookDomain, Status } from "@/types/books.types";

export function buildReadingNowStatusPayload(
  book: BookDomain & { id: string },
  nextStatus: Status,
): BookCreateValidator {
  const payload: BookCreateValidator = {
    title: book.title,
    pages: book.pages,
    readers: [...book.readerIds],
    chosen_by: book.chosen_by,
    user_id: book.user_id,
    author_id: book.authorId ?? "",
    start_date: book.start_date ?? null,
    end_date: book.end_date ?? null,
    planned_start_date: book.planned_start_date ?? null,
    gender: book.gender ?? "",
    image_url: book.image_url ?? "",
    status: nextStatus,
    is_reread: book.is_reread,
  };

  if (payload.status === "reading") {
    payload.end_date = null;
    payload.planned_start_date = null;
  }

  if (payload.status === "paused") {
    payload.planned_start_date = null;
  }

  if (payload.status === "abandoned") {
    payload.start_date = null;
    payload.end_date = null;
    payload.planned_start_date = null;
  }

  return payload;
}
