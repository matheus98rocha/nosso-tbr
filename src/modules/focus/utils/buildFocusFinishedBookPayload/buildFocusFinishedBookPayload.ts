import type { BookCreateValidator } from "@/types/books.types";

import type { FocusBook } from "../../types/focus.types";

export function buildFocusFinishedBookPayload(
  book: FocusBook,
): BookCreateValidator {
  return {
    title: book.title,
    pages: book.pages,
    readers: [...book.readerIds],
    base_readers: [...book.readerIds],
    chosen_by: book.chosenBy,
    user_id: book.userId,
    author_ids: [...book.authorIds],
    start_date: book.startDate,
    end_date: null,
    planned_start_date: null,
    gender: book.gender ?? "",
    image_url: book.imageUrl ?? "",
    status: "finished",
    is_reread: book.isReread,
  };
}
