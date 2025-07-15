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
      this.query = this.query.filter("readers", "eq", `{${readers.join(",")}}`);
    }
    return this;
  }

  withStatus(status?: "not_started" | "reading" | "finished"): this {
    if (!status) return this;

    if (status === "not_started") {
      this.query = this.query.is("start_date", null) as typeof this.query;
    } else if (status === "reading") {
      this.query = this.query
        .not("start_date", "is", null)
        .is("end_date", null) as typeof this.query;
    } else if (status === "finished") {
      this.query = this.query
        .not("start_date", "is", null)
        .not("end_date", "is", null) as typeof this.query;
    }

    return this;
  }

  withGender(gender?: string): this {
    if (gender) {
      this.query = this.query.eq("gender", gender) as typeof this.query;
    }
    return this;
  }

  sortByCreatedAt(ascending = false): this {
    this.query = this.query.order("inserted_at", {
      ascending,
    }) as typeof this.query;
    return this;
  }

  build() {
    return this.query;
  }
}
