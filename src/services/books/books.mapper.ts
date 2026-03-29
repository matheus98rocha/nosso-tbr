import { BookDomain, BookPersistence } from "@/types/books.types";
import { DateUtils } from "@/utils";
import { resolveBookCoverUrl } from "@/constants/bookCover";

export class BookMapper {
  static toDomain(persistence: BookPersistence): BookDomain {
    const {
      id,
      title,
      author,
      author_id,
      chosen_by,
      pages,
      status,
      start_date,
      end_date,
      planned_start_date,
    } = persistence;

    const startDateObj = DateUtils.toDate(start_date);
    const endDateObj = DateUtils.toDate(end_date);
    const plannedDateObj = DateUtils.toDate(planned_start_date);

    return {
      id: id ? id : "",
      title,
      author: author.name || "Autor desconhecido",
      authorId: author_id || undefined,
      chosen_by,
      pages,
      status: status ?? "not_started",
      end_date: endDateObj ? endDateObj.toISOString() : null,
      start_date: startDateObj ? startDateObj.toISOString() : null,
      planned_start_date: plannedDateObj ? plannedDateObj.toISOString() : null,
      readers: Array.isArray(persistence.readers)
        ? (persistence.readers.join(" e ") as BookDomain["readers"])
        : (persistence.readers as BookDomain["readers"]),
      gender: persistence.gender ?? null,
      image_url: resolveBookCoverUrl(persistence.image_url),
      user_id: persistence.user_id,
    };
  }
}
