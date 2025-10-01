import { BookDomain, BookPersistence } from "@/types/books.types";

export class BookMapper {
  static toDomain(persistence: BookPersistence): BookDomain {
    const { id, title, author, chosen_by, pages, start_date, end_date } =
      persistence;

    let status: BookDomain["status"] = "not_started";

    if (start_date) {
      status = "reading";
    }
    if (end_date) {
      status = "finished";
    }

    return {
      id: id ? id : "",
      title,
      author,
      chosen_by,
      pages,
      status,
      end_date,
      start_date,
      readers: Array.isArray(persistence.readers)
        ? (persistence.readers.join(" e ") as BookDomain["readers"])
        : (persistence.readers as BookDomain["readers"]),
      gender: persistence.gender ?? null,
      image_url: persistence.image_url,
      user_id: persistence.user_id,
    };
  }
}
