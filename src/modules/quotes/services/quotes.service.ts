import { createClient } from "@/lib/supabase/client";
import { QuoteDomain, QuotePersistence } from "../types/quotes.types";
import { ErrorHandler, RepositoryError } from "@/services/errors/error";
import { QuoteMapper } from "./mappers/quotes.mappers";

export class QuotesService {
  private supabase = createClient();

  async getQuotesByBook(bookId: string): Promise<QuoteDomain[]> {
    try {
      const { data, error } = await this.supabase
        .from("quotes")
        .select(
          `*,
            book:books(title)`
        )
        .eq("book_id", bookId)
        .order("created_at", { ascending: true });

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
    page?: number
  ): Promise<QuoteDomain> {
    try {
      const payload = QuoteMapper.toPersistence({ bookId, content, page });
      const { data, error } = await this.supabase
        .from("quotes")
        .insert([payload])
        .select()
        .single();

      if (error) {
        throw new RepositoryError(
          "Falha ao criar citação",
          undefined,
          undefined,
          error,
          { bookId, content, page }
        );
      }

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

  async removeQuote(quoteId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from("quotes")
        .delete()
        .eq("id", quoteId);

      if (error) {
        throw new RepositoryError(
          "Falha ao remover citação",
          undefined,
          undefined,
          error,
          { quoteId }
        );
      }
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
