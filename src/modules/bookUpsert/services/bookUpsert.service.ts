import { createClient } from "@/lib/supabase/client";
import { BookCreateValidator } from "@/types/books.types";
import { ErrorHandler, RepositoryError } from "@/services/errors/error";
import { BookQueryBuilder } from "@/services/books/bookQuery.builder";
import { ensureCreatableStatus } from "./bookUpsert.validation";
import { apiJson } from "@/lib/api/clientJsonFetch";

export class BookUpsertService {
  private supabase = createClient();

  async create(book: BookCreateValidator): Promise<{ id: string }> {
    try {
      ensureCreatableStatus(book.status);

      const result = await apiJson<{ id: string }>("/api/books", {
        method: "POST",
        body: JSON.stringify(book),
      });

      if (!result?.id) {
        throw new RepositoryError(
          "Livro criado, mas ID não retornado.",
          undefined,
          undefined,
          undefined,
          { book },
        );
      }

      return result;
    } catch (error) {
      const normalizedError = ErrorHandler.normalize(error, {
        service: "BookService",
        method: "create",
        book,
      });
      ErrorHandler.log(normalizedError);
      throw normalizedError;
    }
  }

  async edit(id: string, book: BookCreateValidator): Promise<void> {
    try {
      await apiJson<{ ok: true }>(
        `/api/books/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          body: JSON.stringify(book),
        },
      );
    } catch (error) {
      const normalizedError = ErrorHandler.normalize(error, {
        service: "BookService",
        method: "edit",
        id,
        book,
      });
      ErrorHandler.log(normalizedError);
      throw normalizedError;
    }
  }

  async checkDuplicateBook(title: string): Promise<boolean> {
    try {
      const supabase = createClient();
      const duplicateCheckQuery = await new BookQueryBuilder(supabase)
        .withSearchTerm(title)
        .build();

      const { data: booksWithSameTitle } = await duplicateCheckQuery;

      return booksWithSameTitle?.length > 0;
    } catch (error) {
      const normalizedError = ErrorHandler.normalize(error, {
        service: "BookService",
        method: "checkDuplicateBook",
        title,
      });
      ErrorHandler.log(normalizedError);
      throw normalizedError;
    }
  }
}
