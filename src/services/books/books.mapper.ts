import { BookDomain, BookPersistence } from "@/types/books.types";
import { DateUtils } from "@/utils";
import { resolveBookCoverUrl } from "@/constants/bookCover";
import { formatList } from "@/utils/formatters";

type UserLookup = { id: string; display_name: string };

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

    const readerIds = Array.isArray(persistence.readers)
      ? persistence.readers.map(String)
      : [];

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
      readerIds,
      readersDisplay: BookMapper.readersDisplayFromIds(readerIds, []),
      gender: persistence.gender ?? null,
      image_url: resolveBookCoverUrl(persistence.image_url),
      user_id: persistence.user_id,
      is_reread: persistence.is_reread ?? false,
    };
  }

  static enrichReadersDisplay(book: BookDomain, users: UserLookup[]): BookDomain {
    const ids = book.readerIds ?? [];
    return {
      ...book,
      readerIds: ids,
      readersDisplay: BookMapper.readersDisplayFromIds(ids, users),
    };
  }

  private static readersDisplayFromIds(
    readerIds: string[],
    users: UserLookup[],
  ): string {
    if (!readerIds.length) return "";
    const labels = readerIds.map(
      (id) => users.find((u) => u.id === id)?.display_name ?? id,
    );
    return formatList(labels);
  }
}
