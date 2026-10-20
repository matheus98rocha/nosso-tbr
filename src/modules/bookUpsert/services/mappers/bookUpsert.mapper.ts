import {
  BookCreateValidator,
  CreateBookPersistence,
} from "@/types/books.types";
import { resolveBookCoverUrl } from "@/constants/bookCover";

export class BookUpsertMapper {
  static primaryAuthorId(authorIds: string[]): string {
    const unique = [...new Set(authorIds.map((id) => id.trim()).filter(Boolean))];
    return unique[0] ?? "";
  }

  static toPersistence(
    domain: BookCreateValidator,
    extra?: Partial<CreateBookPersistence>,
  ): CreateBookPersistence {
    return {
      id: domain.id,
      title: domain.title,
      author_id: BookUpsertMapper.primaryAuthorId(domain.author_ids),
      chosen_by: domain.chosen_by,
      pages: domain.pages,
      status: domain.status ?? "not_started",
      start_date: domain.start_date ?? null,
      planned_start_date: domain.planned_start_date ?? null,
      end_date: domain.end_date ?? null,
      inserted_at: extra?.inserted_at ?? undefined,
      readers: domain.readers,
      gender: domain.gender ?? null,
      image_url: resolveBookCoverUrl(domain.image_url),
      user_id: domain.user_id?.trim() || null,
      is_reread: domain.is_reread ?? false,
    };
  }
}
