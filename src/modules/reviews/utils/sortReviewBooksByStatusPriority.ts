import type { ReviewBookOption } from "../types";

const STATUS_PRIORITY: Record<ReviewBookOption["status"], number> = {
  finished: 0,
  reading: 1,
  not_started: 2,
  planned: 2,
  paused: 2,
  abandoned: 2,
};

export function sortReviewBooksByStatusPriority(books: ReviewBookOption[]) {
  return books
    .map((book, index) => ({ book, index }))
    .sort((a, b) => {
      const priorityDiff = STATUS_PRIORITY[a.book.status] - STATUS_PRIORITY[b.book.status];
      if (priorityDiff !== 0) return priorityDiff;
      return a.index - b.index;
    })
    .map(({ book }) => book);
}
