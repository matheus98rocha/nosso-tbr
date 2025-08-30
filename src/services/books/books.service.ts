import { createClient } from "@/lib/supabase/client";
import { BookMapper } from "@/services/books/books.mapper";
import { BookDomain } from "@/types/books.types";
import { FiltersOptions } from "../../modules/home/components/filtersSheet/filters";
import { BookQueryBuilder } from "./bookQuery.builder";
import { ErrorHandler, RepositoryError } from "@/services/errors/error";

const ALLOWED_STATUSES = ["reading", "finished", "not_started"] as const;
type BookStatus = (typeof ALLOWED_STATUSES)[number];

function isBookStatus(value: unknown): value is BookStatus {
  return ALLOWED_STATUSES.includes(value as BookStatus);
}
export class BookService {
  private supabase = createClient();
  async getAll(
    filters?: FiltersOptions,
    search?: string
  ): Promise<BookDomain[]> {
    try {
      const statuses = (filters?.status ?? []).filter(isBookStatus);

      const query = new BookQueryBuilder(this.supabase)
        .withReaders(filters?.readers)
        .withStatus(statuses)
        .withGender(filters?.gender)
        .sortByCreatedAt()
        .withSearchTerm(search)
        .build();

      const { data, error } = await query;

      if (error) {
        throw new RepositoryError(
          "Falha ao buscar livros",
          undefined,
          undefined,
          error,
          { filters }
        );
      }

      return data.map(BookMapper.toDomain);
    } catch (error) {
      const normalizedError = ErrorHandler.normalize(error, {
        service: "BookService",
        method: "getAll",
        filters,
      });
      ErrorHandler.log(normalizedError);
      throw normalizedError; // Será capturado pelo useQuery
    }
  }
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from("books").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
}
