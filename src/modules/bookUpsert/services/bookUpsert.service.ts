import { createClient } from "@/lib/supabase/client";
import { BookCreateValidator } from "@/types/books.types";
import { ErrorHandler, RepositoryError } from "@/services/errors/error";
import { BookUpsertMapper } from "./mappers/bookUpsert.mapper";

export class BookUpsertService {
  private supabase = createClient();

  async create(book: BookCreateValidator): Promise<{ id: string }> {
    try {
      const payload = BookUpsertMapper.toPersistence(book);
      const { data, error } = await this.supabase
        .from("books")
        .insert(payload)
        .select("id")
        .single();

      if (error) {
        throw new RepositoryError(
          "Falha ao criar livro",
          undefined,
          undefined,
          error,
          { book }
        );
      }

      if (!data?.id) {
        throw new RepositoryError(
          "Livro criado, mas ID não retornado.",
          undefined,
          undefined,
          undefined,
          { book }
        );
      }

      return { id: data.id };
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
      const payload = BookUpsertMapper.toPersistence(book);
      const { error } = await this.supabase
        .from("books")
        .update(payload)
        .eq("id", id);

      if (error) {
        throw new RepositoryError(
          "Falha ao editar livro",
          undefined,
          undefined,
          error,
          { id, book }
        );
      }
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
}
