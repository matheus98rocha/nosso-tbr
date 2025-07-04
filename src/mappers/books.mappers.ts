import {
  BookCreateValidator,
  BookDomain,
  BookPersistence,
} from "@/types/books.types";

export class BookMapper {
  static toDomain(persistence: BookPersistence): BookDomain {
    const { id, title, author, chosen_by, pages, start_date, end_date } =
      persistence;

    let status: BookDomain["status"] = "not_started";
    const now = new Date();

    if (start_date) {
      const start = new Date(start_date);
      if (start <= now) status = "reading";
    }
    if (end_date) {
      const end = new Date(end_date);
      if (end <= now) status = "finished";
    }

    return {
      id: id ? id : "",
      title,
      author,
      chosen_by,
      pages,
      status,
      readers: Array.isArray(persistence.readers)
        ? (persistence.readers.join(" e ") as BookDomain["readers"])
        : (persistence.readers as BookDomain["readers"]),
    };
  }

  static toPersistence(
    domain: BookCreateValidator,
    extra?: Partial<BookPersistence>
  ): BookPersistence {
    return {
      id: domain.id,
      title: domain.title,
      author: domain.author,
      chosen_by: domain.chosen_by,
      pages: domain.pages,
      start_date: domain.start_date ?? null,
      end_date: domain.end_date ?? null,
      inserted_at: extra?.inserted_at ?? undefined,
      readers: Array.isArray(domain.readers)
        ? domain.readers
        : domain.readers
        ? domain.readers.split(" e ")
        : [],
    };
  }
}
