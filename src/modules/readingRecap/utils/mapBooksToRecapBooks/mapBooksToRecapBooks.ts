import type { BookDomain } from "@/types/books.types";

import type { RecapBook } from "../../types";

function recapBookId(book: BookDomain): string {
  const id = book.id?.trim();
  if (id) return id;
  return `${book.title}|${book.end_date ?? ""}|${book.image_url}`;
}

export function mapBooksToRecapBooks(books: BookDomain[]): RecapBook[] {
  const recapBooks: RecapBook[] = [];

  for (const book of books) {
    if (book.status !== "finished") continue;
    if (!book.end_date) continue;

    recapBooks.push({
      id: recapBookId(book),
      title: book.title,
      endDate: book.end_date,
      gender: book.gender,
      imageUrl: book.image_url,
    });
  }

  return recapBooks;
}
