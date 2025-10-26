import { vi } from "vitest";
import { QuoteDomain, QuotePersistence } from "../../types/quotes.types";
import { QuoteMapper } from "./quotes.mappers";

describe("quotes mappers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  describe("#toDomain", () => {
    const mockToDomain: QuotePersistence & { book?: { title: string } } = {
      id: "quote-id",
      book_id: "book-id",
      content: "This is a quote",
      page: 42,
      created_at: "2025-10-09 23:05:48.434413",
      book: { title: "Book Title" },
    };

    const mockPersistenceOnToDomain: QuoteDomain = {
      id: "quote-id",
      bookId: "book-id",
      content: "This is a quote",
      page: 42,
      createdAt: "2025-10-09 23:05:48.434413",
    };
    it("should map persistence to domain", () => {
      const result = QuoteMapper.toDomain(mockToDomain);

      expect(result).toEqual(mockPersistenceOnToDomain);
    });

    it("should map persistence to domain without page", () => {
      const mockToDomainWithoutPage: QuotePersistence & {
        book?: { title: string };
      } = {
        ...mockToDomain,
        page: null,
      };

      const mockPersistenceOnToDomainWithoutPage: QuoteDomain = {
        ...mockPersistenceOnToDomain,
        page: null,
      };

      const result = QuoteMapper.toDomain(mockToDomainWithoutPage);

      expect(result).toEqual(mockPersistenceOnToDomainWithoutPage);
    });
  });

  describe("#toPersistence", () => {
    it("should map domain to persistence", () => {
      const mockToPersistence: Partial<QuotePersistence> = {
        book_id: "123",
        content: "This is a quote",
        page: 42,
      };

      const mockDomainOnToPersistence: QuoteDomain = {
        bookId: "123",
        createdAt: "2025-10-09 23:05:48.434413",
        id: "quote-id",
        content: "This is a quote",
        page: 42,
      };
      const result = QuoteMapper.toPersistence(mockDomainOnToPersistence);

      expect(result).toEqual(mockToPersistence);
    });

    it("should map domain to persistence without page", () => {
      const mockDomainOnToPersistence: QuoteDomain = {
        bookId: "123",
        createdAt: "2025-10-09 23:05:48.434413",
        id: "quote-id",
        content: "This is a quote",
        page: null,
      };

      const mockToPersistence: Partial<QuotePersistence> = {
        book_id: "123",
        content: "This is a quote",
        page: null,
      };

      const result = QuoteMapper.toPersistence(mockDomainOnToPersistence);

      expect(result).toEqual(mockToPersistence);
    });
  });
});
