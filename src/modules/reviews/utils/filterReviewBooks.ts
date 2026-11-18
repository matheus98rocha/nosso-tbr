import type { ReviewBookOption } from "../types";

export function filterReviewBooks(books: ReviewBookOption[], query: string) {
  const term = query.trim().toLocaleLowerCase("pt-BR");
  if (!term) return books;
  return books.filter((book) =>
    `${book.title} ${book.author ?? ""}`.toLocaleLowerCase("pt-BR").includes(term),
  );
}
