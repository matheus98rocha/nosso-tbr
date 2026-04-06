import { createClient } from "@/lib/supabase/client";
import { BookMapper } from "@/services/books/books.mapper";
import { BookDomain, Status } from "@/types/books.types";
import { BookQueryBuilder } from "./bookQuery.builder";
import { ErrorHandler, RepositoryError } from "@/services/errors/error";
import { apiJson } from "@/lib/api/clientJsonFetch";
import { FiltersOptions } from "@/types/filters";
import { ALL_BOOK_STATUSES } from "@/constants/bookStatuses";

const ALLOWED_STATUSES: Status[] = ALL_BOOK_STATUSES;

type BookStatus = (typeof ALLOWED_STATUSES)[number];

function isBookStatus(value: unknown): value is BookStatus {
  return ALLOWED_STATUSES.includes(value as BookStatus);
}

function normalizeStatusesForQuery(statuses: BookStatus[]): BookStatus[] {
  if (!statuses.includes("planned")) return statuses;

  const expanded = new Set<BookStatus>(statuses);
  /**
   * Compatibilidade de dados: "Vou iniciar a leitura" já foi salvo como
   * `not_started` em parte do catálogo.
   * Ao filtrar por "planned", buscamos ambos para não perder livros agendados.
   */
  expanded.add("not_started");

  return Array.from(expanded).sort();
}

export class BookService {
  private supabase = createClient();

  async getAll({
    bookId,
    filters,
    search,
    userId,
    relationshipUserValues,
    authorId,
    page = 0,
    pageSize = 10,
  }: {
    filters?: FiltersOptions;
    search?: string;
    userId?: string;
    relationshipUserValues?: string[];
    bookId?: string;
    authorId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: BookDomain[]; total: number }> {
    try {
      const statuses = normalizeStatusesForQuery(
        (filters?.status ?? []).filter(isBookStatus),
      );

      const query = new BookQueryBuilder(this.supabase)
        .withReaders(filters?.readers)
        .withStatus(statuses)
        .withGender(filters?.gender)
        .withYear(filters?.year)
        .withSearchTerm(search)
        .withId(bookId)
        .withAuthor(authorId)
        .withUserRelationship(relationshipUserValues)
        .withUser(userId)
        .withDefaultOrdering(statuses.includes("planned"))
        .withPagination(page, pageSize);

      const { data, error, count } = await query.build();

      if (error) {
        throw new RepositoryError(
          "Falha ao buscar livros",
          undefined,
          undefined,
          error,
          { filters, page, pageSize },
        );
      }

      return {
        data: (data || []).map(BookMapper.toDomain),
        total: count || 0,
      };
    } catch (error) {
      const normalizedError = ErrorHandler.normalize(error, {
        service: "BookService",
        method: "getAll",
        filters,
      });
      ErrorHandler.log(normalizedError);
      throw normalizedError;
    }
  }

  async delete(id: string): Promise<void> {
    await apiJson<{ ok: true }>(`/api/books/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }
}
