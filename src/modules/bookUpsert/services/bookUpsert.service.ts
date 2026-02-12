import { createClient } from "@/lib/supabase/client";
import { BookCreateValidator } from "@/types/books.types";
import { ErrorHandler, RepositoryError } from "@/services/errors/error";
import { BookUpsertMapper } from "./mappers/bookUpsert.mapper";
import { BookQueryBuilder } from "@/services/books/bookQuery.builder";
import { ComboboxOption } from "../types/authorOptions";

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
          { book },
        );
      }

      if (!data?.id) {
        throw new RepositoryError(
          "Livro criado, mas ID não retornado.",
          undefined,
          undefined,
          undefined,
          { book },
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
          { id, book },
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
  async searchAuthors(term: string): Promise<ComboboxOption[]> {
    try {
      let query = this.supabase
        .from("authors")
        .select("id, name")
        .order("name", { ascending: true })
        .limit(10);

      if (term) {
        query = query.ilike("name", `%${term}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw new RepositoryError(
          "Falha ao buscar autores",
          undefined,
          undefined,
          error,
          { term },
        );
      }

      return data || [];
    } catch (error) {
      const normalizedError = ErrorHandler.normalize(error, {
        service: "BookService",
        method: "searchAuthors",
        term,
      });
      ErrorHandler.log(normalizedError);
      throw normalizedError;
    }
  }

  async createAuthor(name: string): Promise<{ id: string; name: string }> {
    try {
      const { data, error } = await this.supabase
        .from("authors")
        .insert({ name })
        .select("id, name")
        .single();

      if (error) {
        throw new RepositoryError(
          "Falha ao criar autor",
          undefined,
          undefined,
          error,
          { name },
        );
      }

      if (!data) {
        throw new RepositoryError(
          "Autor criado, mas dados não retornados.",
          undefined,
          undefined,
          undefined,
          { name },
        );
      }

      return data;
    } catch (error) {
      const normalizedError = ErrorHandler.normalize(error, {
        service: "BookService",
        method: "createAuthor",
        name,
      });
      ErrorHandler.log(normalizedError);
      throw normalizedError;
    }
  }
}
