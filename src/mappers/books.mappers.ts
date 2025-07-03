import { BookDomain, BookPersistence } from "@/types/books.types";

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
      id,
      title,
      author,
      chosen_by,
      pages,
      status,
    };
  }

  static toPersistence(
    domain: BookDomain,
    extra?: Partial<BookPersistence>
  ): BookPersistence {
    let start_date: string | null = null;
    let end_date: string | null = null;

    const now = new Date().toISOString().slice(0, 10); // yyyy-mm-dd

    switch (domain.status) {
      case "not_started":
        start_date = null;
        end_date = null;
        break;
      case "reading":
        start_date = now;
        end_date = null;
        break;
      case "finished":
        start_date = now;
        end_date = now;
        break;
    }

    return {
      id: domain.id,
      title: domain.title,
      author: domain.author,
      chosen_by: domain.chosen_by,
      pages: domain.pages,
      start_date,
      end_date,
      inserted_at: extra?.inserted_at ?? undefined,
    };
  }
}
