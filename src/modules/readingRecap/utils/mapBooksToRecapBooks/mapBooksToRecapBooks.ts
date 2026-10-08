import type { BookDomain } from "@/types/books.types";

import type { RecapBook } from "../../types";

export function mapBooksToRecapBooks(books: BookDomain[]): RecapBook[] {
  const recapBooks: RecapBook[] = [];

  for (const book of books) {
    if (book.status !== "finished") continue;
    if (!book.end_date) continue;

    recapBooks.push({
      title: book.title,
      endDate: book.end_date,
      gender: book.gender,
      imageUrl: book.image_url,
    });
  }

  return recapBooks;
}
