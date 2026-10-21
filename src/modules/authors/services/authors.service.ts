import { createClient } from "@/lib/supabase/client";
import { apiJson } from "@/lib/api/clientJsonFetch";
import { ErrorHandler, RepositoryError } from "@/services/errors/error";
import { AuthorDomain, AuthorPersistence } from "../types";
import { AuthorMapper } from "./mappers/authors.mapper";
import { ComboboxOption } from "@/modules/bookUpsert/types/authorOptions";

export const AUTHOR_LIST_SORTS = ["name", "totalBooks", "createdAt"] as const;

export type AuthorListSort = (typeof AUTHOR_LIST_SORTS)[number];

const AUTHOR_SORT_COLUMNS = {
  name: "name",
  totalBooks: "total_books",
  createdAt: "created_at",
} as const;

export function resolveAuthorListOrder(
  sortBy: string | undefined,
  sortAscending: boolean | undefined,
  withCountBooks: boolean,
): { column: "name" | "total_books" | "created_at"; ascending: boolean } {
  const ascending = sortAscending ?? true;

  if (sortBy === "name") {
    return { column: AUTHOR_SORT_COLUMNS.name, ascending };
  }

  if (sortBy === "totalBooks" && withCountBooks) {
    return { column: AUTHOR_SORT_COLUMNS.totalBooks, ascending };
  }

  return { column: AUTHOR_SORT_COLUMNS.createdAt, ascending };
}

export class AuthorsService {
  private supabase = createClient();

  async createAuthor(name: string): Promise<{ id: string; name: string }> {
    try {
      const data = await apiJson<{ id: string; name: string }>(
        "/api/authors",
        {
          method: "POST",
          body: JSON.stringify({ name }),
        },
      );

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
        service: "AuthorsService",
        method: "createAuthor",
        name,
      });
      ErrorHandler.log(normalizedError);
      throw normalizedError;
    }
  }

  async editAuthor(name: string, id: string) {
    try {
      await apiJson<{ ok: true }>(`/api/authors/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
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

  async deleteAuthor(id: string) {
    try {
      await apiJson<{ ok: true }>(`/api/authors/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch (error) {
      const normalizedError = ErrorHandler.normalize(error, {
        service: "AuthorsService",
        method: "delete",
        id,
      });
      ErrorHandler.log(normalizedError);
      throw normalizedError;
    }
  }

  async getAuthors({
    withCountBooks = false,
    page = 0,
    pageSize = 10,
    searchName,
    sortBy,
    sortAscending,
  }: {
    withCountBooks?: boolean;
    page?: number;
    pageSize?: number;
    searchName?: string;
    sortBy?: AuthorListSort;
    sortAscending?: boolean;
  }): Promise<{ data: AuthorDomain[]; total: number }> {
    try {
      const payload = withCountBooks ? "authors_with_counts" : "authors";
      const order = resolveAuthorListOrder(
        sortBy,
        sortAscending,
        withCountBooks,
      );

      let query = this.supabase
        .from(payload)
        .select("*", { count: "exact" })
        .order(order.column, { ascending: order.ascending })
        .order("id", { ascending: true });

      if (searchName?.trim()) {
        query = query.ilike("name", `%${searchName}%`);
      }

      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query.range(from, to);

      if (error) {
        throw new RepositoryError(
          "Falha ao buscar Autores",
          undefined,
          undefined,
          error,
          { page, pageSize, searchName },
        );
      }

      const domainAuthors = (data || []).map((row) =>
        AuthorMapper.toDomain(row as AuthorPersistence),
      );

      return {
        data: domainAuthors,
        total: count || 0,
      };
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
        service: "AuthorsService",
        method: "searchAuthors",
        term,
      });
      ErrorHandler.log(normalizedError);
      throw normalizedError;
    }
  }
}
