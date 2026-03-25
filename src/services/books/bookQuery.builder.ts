import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../database.types";
import { Status } from "@/types/books.types";

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
      this.query = this.query.contains("readers", [...readers].sort());
    }
    return this;
  }

  withStatus(statuses?: Status[]): this {
    if (!statuses || statuses.length === 0) return this;
    this.query = this.query.in("status", statuses);
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

  withUserRelationship(userValues?: string | string[]): this {
    const values = Array.isArray(userValues)
      ? userValues.filter((value) => !!value?.trim())
      : userValues
        ? [userValues]
        : [];

    if (values.length === 0) return this;

    const uniqueValues = [...new Set(values)];
    const orConditions = uniqueValues.flatMap((value) => {
      const escapedValue = value.replace(/"/g, '\\"');
      return [
        `readers.cs.{"${escapedValue}"}`,
        `chosen_by.eq.${escapedValue}`,
      ];
    });

    this.query = this.query.or(orConditions.join(","));

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
