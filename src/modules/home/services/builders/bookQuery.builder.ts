import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../../../database.types";

export class BookQueryBuilder {
  private query: ReturnType<SupabaseClient<Database>["from"]>["select"];

  constructor(
    supabase: SupabaseClient<Database>,
    initialQuery = supabase.from("books").select("*")
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
    if (searchTerm?.trim()) {
      const ilikeValue = `%${searchTerm}%`;
      this.query = this.query.or(
        `title.ilike.${ilikeValue},author.ilike.${ilikeValue}`
      );
    }
    return this;
  }

  build() {
    return this.query;
  }
}
