import { createClient } from "@/lib/supabase/client";
import { ErrorHandler, RepositoryError } from "@/services/errors/error";
import { AuthorDomain, AuthorPersistence } from "../types";
import { AuthorMapper } from "./mappers/authors.mapper";
import { ComboboxOption } from "@/modules/bookUpsert/types/authorOptions";

export class AuthorsService {
  private supabase = createClient();

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

  async editAuthor(name: string, id: string) {
    try {
      const payload = { name, id };
      const { error } = await this.supabase
        .from("authors")
        .update(payload)
        .eq("id", id);

      if (error) {
        throw new RepositoryError(
          "Falha ao editar autor",
          undefined,
          undefined,
          error,
          { id, name },
        );
      }
    } catch (error) {
      const normalizedError = ErrorHandler.normalize(error, {
        service: "AuthorsService",
        method: "edit",
        id,
        name,
      });
      ErrorHandler.log(normalizedError);
      throw normalizedError;
    }
  }

  async getAuthors(): Promise<AuthorDomain[]> {
    try {
      const { data, error } = await this.supabase
        .from("authors")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        throw new RepositoryError(
          "Falha ao buscar Autores",
          undefined,
          undefined,
          error,
        );
      }

      if (!data) return [];

      return data.map((row) => AuthorMapper.toDomain(row as AuthorPersistence));
    } catch (error) {
      const normalizedError = ErrorHandler.normalize(error, {
        service: "AuthorsService",
        method: "getAuthors",
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
}
