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

  withStatus(
    statuses?: ("not_started" | "reading" | "finished" | "planned")[],
  ): this {
    if (!statuses || statuses.length === 0) return this;

    const filters = statuses
      .map((status) => {
        if (status === "not_started") {
          return `and(start_date.is.null,planned_start_date.is.null)`;
        } else if (status === "planned") {
          return `and(start_date.is.null,planned_start_date.not.is.null)`;
        } else if (status === "reading") {
          return `and(start_date.not.is.null,end_date.is.null)`;
        } else if (status === "finished") {
          return `and(start_date.not.is.null,end_date.not.is.null)`;
        }
        return "";
      })
      .filter(Boolean);

    if (filters.length > 0) {
      this.query = this.query.or(filters.join(","));
    }

    return this;
  }

  withDefaultOrdering(isPlannedFilterActive: boolean): this {
    this.query = this.query.order("end_date", {
      ascending: false,
      nullsFirst: true,
    });

    if (isPlannedFilterActive) {
      this.query = this.query.order("planned_start_date", {
        ascending: true,
        nullsFirst: false,
      });
    } else {
      this.query = this.query.order("inserted_at", {
        ascending: false,
      });
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

  withSearchTerm(searchTerm?: string): this {
    if (!searchTerm?.trim()) return this;
    const cleanTerm = searchTerm.replace(/[^\w\sÀ-ÿ]/g, " ").trim();
    const words = cleanTerm.split(/\s+/).filter((word) => word.length >= 1);

    if (words.length > 0) {
      const formattedSearch = words.map((word) => `${word}:*`).join(" & ");
      this.query = this.query.filter("search_vector", "fts", formattedSearch);
    }
    return this;
  }

  withUser(userId?: string): this {
    if (userId) this.query = this.query.eq("user_id", userId);
    return this;
  }

  withId(bookId?: string): this {
    if (bookId) this.query = this.query.eq("id", bookId);
    return this;
  }

  withAuthor(authorId?: string): this {
    if (authorId && authorId.trim() !== "") {
      this.query = this.query.eq("author_id", authorId);
    }
    return this;
  }
  withYear(year?: number): this {
    if (!year) return this;

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    this.query = this.query.or(
      `and(planned_start_date.gte.${startDate},planned_start_date.lte.${endDate}),` +
        `and(end_date.gte.${startDate},end_date.lte.${endDate})`,
    );

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
