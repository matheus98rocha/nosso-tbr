import { QuoteDomain, QuotePersistence } from "../../types/quotes.types";

export class QuoteMapper {
  static toDomain(
    data: QuotePersistence & { book?: { title: string } }
  ): QuoteDomain {
    return {
      id: data.id,
      bookId: data.book_id,
      content: data.content,
      page: data.page ?? null,
      createdAt: data.created_at,
      bookTitle: data.book?.title ?? undefined,
    };
  }

  static toPersistence(
    domain: Partial<QuoteDomain>
  ): Partial<QuotePersistence> {
    return {
      book_id: domain.bookId,
      content: domain.content,
      page: domain.page ?? null,
    };
  }
}
