import { createClient } from "@/lib/supabase/client";
import { apiJson } from "@/lib/api/clientJsonFetch";
import { QuoteDomain, QuotePersistence } from "../types/quotes.types";
import { ErrorHandler, RepositoryError } from "@/services/errors/error";
import { QuoteMapper } from "./mappers/quotes.mappers";

export class QuotesService {
  private supabase = createClient();

  async getQuotesByBook(bookId: string): Promise<QuoteDomain[]> {
    try {
      const { data, error } = await this.supabase
        .from("quotes")
        .select("*")
        .eq("book_id", bookId)
        .order("updated_at", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        throw new RepositoryError(
          "Falha ao buscar citações",
          undefined,
          undefined,
          error,
          { bookId }
        );
      }

      if (!data) return [];

      return data.map((row) => QuoteMapper.toDomain(row as QuotePersistence));
    } catch (error) {
      const normalizedError = ErrorHandler.normalize(error, {
        service: "QuotesService",
        method: "getQuotesByBook",
        bookId,
      });
      ErrorHandler.log(normalizedError);
      throw normalizedError;
    }
  }

  async createQuote(
    bookId: string,
    content: string,
    page: number | null
  ): Promise<QuoteDomain> {
    try {
      const data = await apiJson<QuotePersistence>(
        "/api/quotes",
        {
          method: "POST",
          body: JSON.stringify({
            bookId,
            content,
            page,
          }),
        },
      );

      return QuoteMapper.toDomain(data as QuotePersistence);
    } catch (error) {
      const normalizedError = ErrorHandler.normalize(error, {
        service: "QuotesService",
        method: "createQuote",
        bookId,
        content,
        page,
      });
      ErrorHandler.log(normalizedError);
      throw normalizedError;
    }
  }

  async updateQuote(
    quoteId: string,
    content: string,
    page?: number
  ): Promise<QuoteDomain> {
    try {
      const data = await apiJson<QuotePersistence>(
        `/api/quotes/${encodeURIComponent(quoteId)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ content, page }),
        },
      );

      return QuoteMapper.toDomain(data as QuotePersistence);
    } catch (error) {
      const normalizedError = ErrorHandler.normalize(error, {
        service: "QuotesService",
        method: "updateQuote",
        quoteId,
        content,
        page,
      });
      ErrorHandler.log(normalizedError);
      throw normalizedError;
    }
  }

  async removeQuote(quoteId: string): Promise<void> {
    try {
      await apiJson<{ ok: true }>(
        `/api/quotes/${encodeURIComponent(quoteId)}`,
        {
          method: "DELETE",
        },
      );
    } catch (error) {
      const normalizedError = ErrorHandler.normalize(error, {
        service: "QuotesService",
        method: "removeQuote",
        quoteId,
      });
      ErrorHandler.log(normalizedError);
      throw normalizedError;
    }
  }
}
