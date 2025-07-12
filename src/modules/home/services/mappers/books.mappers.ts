import {
  BookCreateValidator,
  BookDomain,
  BookPersistence,
} from "@/modules/home/types/books.types";

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
      gender: domain.gender ?? null,
      image_url: domain.image_url,
    };
  }
}
