import type { BookDomain } from "@/types/books.types";

function compareNextReadingBooks(
  left: BookDomain & { id: string },
  right: BookDomain & { id: string },
): number {
  const leftDate = left.planned_start_date ?? "";
  const rightDate = right.planned_start_date ?? "";

  if (leftDate !== rightDate) {
    return leftDate < rightDate ? -1 : 1;
  }

  const titleCompare = left.title.localeCompare(right.title, "pt-BR", {
    sensitivity: "base",
  });
  if (titleCompare !== 0) {
    return titleCompare;
  }

  return left.id.localeCompare(right.id);
}

export function selectNextReadingBook(
  books: BookDomain[],
): (BookDomain & { id: string }) | null {
  const eligible = books.filter(
    (book): book is BookDomain & { id: string } =>
      typeof book.id === "string" &&
      !!book.planned_start_date &&
      (book.status === "planned" || book.status === "not_started"),
  );

  if (eligible.length === 0) {
    return null;
  }

  return [...eligible].sort(compareNextReadingBooks)[0] ?? null;
}
