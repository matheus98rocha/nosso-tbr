import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../database.types";

export class BookQueryBuilder {
  private query: ReturnType<SupabaseClient<Database>["from"]>["select"];

  constructor(
    supabase: SupabaseClient<Database>,
    initialQuery = supabase.from("books").select(
      `
      *,
      author:authors!books_author_id_fkey (
        name
      )
    `,
      { count: "exact" },
    ),
  ) {
    this.query = initialQuery;
  }

  withReaders(readers?: string[]): this {
    if (readers?.length) {
      this.query = this.query.contains("readers", readers);
    }
    return this;
  }

  withStatus(statuses?: ("not_started" | "reading" | "finished")[]): this {
    if (!statuses || statuses.length === 0) return this;

    const filters = statuses
      .map((status) => {
        if (status === "not_started") {
          return `start_date.is.null`;
        } else if (status === "reading") {
          return `and(start_date.not.is.null,end_date.is.null)`;
        } else if (status === "finished") {
          return `and(start_date.not.is.null,end_date.not.is.null)`;
        }
        return "";
      })
      .filter(Boolean);

    if (filters.length > 0) {
      const rawFilter = filters.join(",");
      this.query = this.query.or(rawFilter) as typeof this.query;
    }

    return this;
  }

  withGender(genders?: string[]): this {
    if (!genders || genders.length === 0) return this;

    if (genders.length === 1) {
      this.query = this.query.eq("gender", genders[0]);
    } else {
      this.query = this.query.in("gender", genders);
    }

    return this;
  }

  sortByCreatedAt(ascending = false): this {
    this.query = this.query.order("inserted_at", {
      ascending,
    }) as typeof this.query;
    return this;
  }

  withSearchTerm(searchTerm?: string): this {
    if (!searchTerm?.trim()) return this;

    const cleanTerm = searchTerm.replace(/[^\w\sÀ-ÿ]/g, " ").trim();

    const words = cleanTerm.split(/\s+/).filter((word) => word.length >= 1); // Mantém o "2"

    if (words.length > 0) {
      const formattedSearch = words.map((word) => `${word}:*`).join(" & ");

      this.query = this.query.filter("search_vector", "fts", formattedSearch);
    }

    return this;
  }

  withUser(userId?: string): this {
    if (userId) {
      this.query = this.query.eq("user_id", userId);
    }
    return this;
  }

  withId(bookId?: string): this {
    if (bookId) {
      this.query = this.query.eq("id", bookId);
    }
    return this;
  }

  withAuthor(authorId?: string) {
    if (authorId && authorId.trim() !== "") {
      this.query = this.query.eq("author_id", authorId);
    }
    return this;
  }

  withPagination(page: number, pageSize: number): this {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    this.query = this.query.range(from, to);
    return this;
  }

  build() {
    return this.query;
  }
}
