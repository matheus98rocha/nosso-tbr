import { BookCreateValidator, BookPersistence } from "@/types/books.types";

export class BookUpsertMapper {
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
