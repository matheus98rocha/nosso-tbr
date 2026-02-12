import {
  BookCreateValidator,
  CreateBookPersistence,
} from "@/types/books.types";

export class BookUpsertMapper {
  static toPersistence(
    domain: BookCreateValidator,
    extra?: Partial<CreateBookPersistence>,
  ): CreateBookPersistence {
    return {
      id: domain.id,
      title: domain.title,
      author_id: domain.author_id,
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
      user_id: domain.user_id ?? "",
    };
  }
}
