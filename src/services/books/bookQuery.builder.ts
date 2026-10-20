import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../database.types";
import { Status } from "@/types/books.types";
import { buildFtsQueryFromUserSearch } from "./buildFtsQueryFromUserSearch";

const BOOKS_SELECT = `
  *,
  author:authors!books_author_id_fkey (
    name
  ),
  book_authors (
    author_id,
    authors (
      name
    )
  )
`;

const BOOKS_SELECT_BY_AUTHOR = `
  *,
  author:authors!books_author_id_fkey (
    name
  ),
  book_authors!inner (
    author_id,
    authors (
      name
    )
  )
`;

function buildBaseQuery(
  supabase: SupabaseClient<Database>,
  select = BOOKS_SELECT,
) {
  return supabase.from("books").select(select, { count: "exact" });
}

type BookQuery = ReturnType<typeof buildBaseQuery>;

export class BookQueryBuilder {
  private query: BookQuery;
  private readonly supabase: SupabaseClient<Database>;
  private readonly appliedFilters: Array<(query: BookQuery) => BookQuery> = [];
  private authorIdFilter: string | undefined;

  private static buildStatusOrCondition(statuses: Status[]): string {
    const unique = [...new Set(statuses)];
    const hasPlanned = unique.includes("planned");

    if (!hasPlanned) {
      return unique.map((status) => `status.eq.${status}`).join(",");
    }

    const nonPlanned = unique.filter((status) => status !== "planned");
    const conditions = [
      ...nonPlanned.map((status) => `status.eq.${status}`),
      "status.eq.planned",
      "and(status.eq.not_started,planned_start_date.not.is.null)",
    ];

    return conditions.join(",");
  }

  private static quotePostgrestTextValue(value: string): string {
    const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `"${escaped}"`;
  }

  constructor(
    supabase: SupabaseClient<Database>,
    initialQuery?: BookQuery,
  ) {
    this.supabase = supabase;
    this.query = initialQuery ?? buildBaseQuery(supabase);
  }

  private apply(filter: (query: BookQuery) => BookQuery): this {
    this.appliedFilters.push(filter);
    this.query = filter(this.query);
    return this;
  }

  withReaders(readers?: string[]): this {
    if (readers?.length) {
      const sorted = [...readers].sort();
      return this.apply((query) => query.contains("readers", sorted));
    }
    return this;
  }

  withReadersOverlap(readerIds?: string[]): this {
    const ids = readerIds?.filter((id) => !!id?.trim()) ?? [];
    if (ids.length === 0) return this;
    return this.apply((query) => query.overlaps("readers", ids));
  }

  withExcludingSingleReaderSnapshots(readerIds?: string[]): this {
    const ids = readerIds?.filter((id) => !!id?.trim()) ?? [];
    if (ids.length === 0) return this;

    for (const id of ids) {
      const quoted = BookQueryBuilder.quotePostgrestTextValue(id.trim());
      this.apply((query) => query.not("readers", "eq", `{${quoted}}`));
    }

    return this;
  }

  withStatus(statuses?: Status[]): this {
    if (!statuses || statuses.length === 0) return this;
    const statusCondition = BookQueryBuilder.buildStatusOrCondition(statuses);
    return this.apply((query) => query.or(statusCondition));
  }

  withDefaultOrdering(isPlannedFilterActive: boolean): this {
    this.apply((query) =>
      query.order("end_date", {
        ascending: false,
        nullsFirst: true,
      }),
    );

    if (isPlannedFilterActive) {
      return this.apply((query) =>
        query.order("planned_start_date", {
          ascending: true,
          nullsFirst: false,
        }),
      );
    }

    return this.apply((query) =>
      query.order("inserted_at", {
        ascending: false,
      }),
    );
  }

  withPageOrdering(sort: "pages_asc" | "pages_desc"): this {
    return this.apply((query) =>
      query.order("pages", {
        ascending: sort === "pages_asc",
        nullsFirst: false,
      }),
    );
  }

  withGender(genders?: string[]): this {
    if (!genders || genders.length === 0) return this;
    if (genders.length === 1) {
      return this.apply((query) => query.eq("gender", genders[0]));
    }
    return this.apply((query) => query.in("gender", genders));
  }

  withSearchTerm(searchTerm?: string): this {
    const ftsQuery = buildFtsQueryFromUserSearch(searchTerm);
    if (ftsQuery) {
      return this.apply((query) =>
        query.textSearch("search_vector", ftsQuery, {
          type: "plain",
          config: "simple",
        }),
      );
    }
    return this;
  }

  withExcludedBookParticipant(participantUserId?: string): this {
    const id = participantUserId?.trim();
    if (!id) return this;
    const quoted = BookQueryBuilder.quotePostgrestTextValue(id);
    return this.apply((query) =>
      query.neq("chosen_by", id).not("readers", "cs", `{${quoted}}`),
    );
  }

  withUserRelationship(userValues?: string | string[]): this {
    const values = Array.isArray(userValues)
      ? userValues.filter((value) => !!value?.trim())
      : userValues
        ? [userValues]
        : [];

    if (values.length === 0) return this;

    const uniqueValues = [...new Set(values)].map((v) => v.trim());
    const quotedValues = uniqueValues.map((value) =>
      BookQueryBuilder.quotePostgrestTextValue(value),
    );
    const listForOv = quotedValues.join(",");
    const listForIn = quotedValues.join(",");

    return this.apply((query) =>
      query.or(`readers.ov.{${listForOv}},chosen_by.in.(${listForIn})`),
    );
  }

  withUser(userId?: string): this {
    if (userId) {
      return this.apply((query) => query.eq("user_id", userId));
    }
    return this;
  }

  withId(bookId?: string): this {
    if (bookId) {
      return this.apply((query) => query.eq("id", bookId));
    }
    return this;
  }

  withAuthor(authorId?: string): this {
    if (authorId && authorId.trim() !== "") {
      this.authorIdFilter = authorId.trim();
    }
    return this;
  }

  withReread(isReread?: boolean): this {
    if (isReread) {
      return this.apply((query) => query.eq("is_reread", true));
    }
    return this;
  }

  withYear(year?: number): this {
    if (!year) return this;

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    return this.apply((query) =>
      query.or(
        `and(planned_start_date.gte.${startDate},planned_start_date.lte.${endDate}),` +
          `and(start_date.gte.${startDate},start_date.lte.${endDate}),` +
          `and(end_date.gte.${startDate},end_date.lte.${endDate})`,
      ),
    );
  }

  withPagination(page: number, pageSize: number): this {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    return this.apply((query) => query.range(from, to));
  }

  build() {
    if (!this.authorIdFilter) {
      return this.query;
    }

    const authorId = this.authorIdFilter;
    let query = buildBaseQuery(this.supabase, BOOKS_SELECT_BY_AUTHOR).eq(
      "book_authors.author_id",
      authorId,
    );

    for (const filter of this.appliedFilters) {
      query = filter(query);
    }

    this.query = query;
    return this.query;
  }
}
