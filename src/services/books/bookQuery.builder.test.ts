import { beforeEach, describe, expect, it, vi } from "vitest";
import { BookQueryBuilder } from "./bookQuery.builder";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../database.types";

const buildMockQuery = () => ({
  contains: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  filter: vi.fn().mockReturnThis(),
  textSearch: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
});

const buildMockSupabase = (mockQuery: ReturnType<typeof buildMockQuery>) => {
  const mockSelect = vi.fn().mockReturnValue(mockQuery);
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
  return { from: mockFrom } as unknown as SupabaseClient<Database>;
};

describe("BookQueryBuilder", () => {
  describe("withSearchTerm", () => {
    let mockQuery: ReturnType<typeof buildMockQuery>;
    let supabase: SupabaseClient<Database>;

    beforeEach(() => {
      mockQuery = buildMockQuery();
      supabase = buildMockSupabase(mockQuery);
    });

    it("uses textSearch plain + simple config so lexemes match to_tsvector(simple) on search_vector", () => {
      new BookQueryBuilder(supabase, mockQuery as never)
        .withSearchTerm("Senhor dos aneis A")
        .build();

      expect(mockQuery.textSearch).toHaveBeenCalledWith("search_vector", "senhor aneis", {
        type: "plain",
        config: "simple",
      });
    });

    it("does not apply FTS when the term reduces to only stop words", () => {
      new BookQueryBuilder(supabase, mockQuery as never)
        .withSearchTerm("o a de")
        .build();

      expect(mockQuery.textSearch).not.toHaveBeenCalled();
    });
  });

  describe("withUserRelationship", () => {
    let mockQuery: ReturnType<typeof buildMockQuery>;
    let supabase: SupabaseClient<Database>;

    beforeEach(() => {
      mockQuery = buildMockQuery();
      supabase = buildMockSupabase(mockQuery);
    });

    it("filters by readers containing the user id", () => {
      new BookQueryBuilder(supabase, mockQuery as never)
        .withUserRelationship("user-123")
        .build();

      expect(mockQuery.or).toHaveBeenCalledWith(
        'readers.cs.{"user-123"},chosen_by.eq."user-123"',
      );
    });

    it("filters by chosen_by equality as part of the OR expression", () => {
      new BookQueryBuilder(supabase, mockQuery as never)
        .withUserRelationship("owner-42")
        .build();

      expect(mockQuery.or).toHaveBeenCalledWith(
        expect.stringContaining('chosen_by.eq."owner-42"'),
      );
    });

    it("combines readers containment and chosen_by equality with OR", () => {
      new BookQueryBuilder(supabase, mockQuery as never)
        .withUserRelationship("abc")
        .build();

      expect(mockQuery.or).toHaveBeenCalledWith(
        'readers.cs.{"abc"},chosen_by.eq."abc"',
      );
    });

    it("supports multiple user ids in OR conditions", () => {
      new BookQueryBuilder(supabase, mockQuery as never)
        .withUserRelationship(["11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222"])
        .build();

      expect(mockQuery.or).toHaveBeenCalledWith(
        'readers.cs.{"11111111-1111-4111-8111-111111111111"},chosen_by.eq."11111111-1111-4111-8111-111111111111",readers.cs.{"22222222-2222-4222-8222-222222222222"},chosen_by.eq."22222222-2222-4222-8222-222222222222"',
      );
    });

    it("does not apply relationship filter when values resolve to empty (no scoped ids)", () => {
      new BookQueryBuilder(supabase, mockQuery as never)
        .withUserRelationship([])
        .build();

      expect(mockQuery.or).not.toHaveBeenCalled();
    });

    it("quotes special characters safely in PostgREST OR expressions", () => {
      new BookQueryBuilder(supabase, mockQuery as never)
        .withUserRelationship('user, "special" value')
        .build();

      expect(mockQuery.or).toHaveBeenCalledWith(
        'readers.cs.{"user, \\"special\\" value"},chosen_by.eq."user, \\"special\\" value"',
      );
    });
  });

  describe("withReaders", () => {
    let mockQuery: ReturnType<typeof buildMockQuery>;
    let supabase: SupabaseClient<Database>;

    beforeEach(() => {
      mockQuery = buildMockQuery();
      supabase = buildMockSupabase(mockQuery);
    });

    it("applies contains filter with the provided readers", () => {
      new BookQueryBuilder(supabase, mockQuery as never)
        .withReaders([
          "11111111-1111-4111-8111-111111111111",
          "22222222-2222-4222-8222-222222222222",
        ])
        .build();

      expect(mockQuery.contains).toHaveBeenCalledWith(
        "readers",
        [
          "11111111-1111-4111-8111-111111111111",
          "22222222-2222-4222-8222-222222222222",
        ],
      );
    });

    it("normalizes reader order so permutations produce the same query", () => {
      const mockQueryA = buildMockQuery();
      const mockQueryB = buildMockQuery();
      const supabaseA = buildMockSupabase(mockQueryA);
      const supabaseB = buildMockSupabase(mockQueryB);

      const a = "11111111-1111-4111-8111-111111111111";
      const b = "22222222-2222-4222-8222-222222222222";

      new BookQueryBuilder(supabaseA, mockQueryA as never)
        .withReaders([a, b])
        .build();

      new BookQueryBuilder(supabaseB, mockQueryB as never)
        .withReaders([b, a])
        .build();

      const sorted = [a, b].sort();
      expect(mockQueryA.contains).toHaveBeenCalledWith("readers", sorted);
      expect(mockQueryB.contains).toHaveBeenCalledWith("readers", sorted);
    });

    it("does not apply filter when readers is undefined", () => {
      new BookQueryBuilder(supabase, mockQuery as never)
        .withReaders(undefined)
        .build();

      expect(mockQuery.contains).not.toHaveBeenCalled();
    });

    it("does not apply filter when readers is an empty array", () => {
      new BookQueryBuilder(supabase, mockQuery as never)
        .withReaders([])
        .build();

      expect(mockQuery.contains).not.toHaveBeenCalled();
    });

    it("applies filter with a single reader", () => {
      new BookQueryBuilder(supabase, mockQuery as never)
        .withReaders(["11111111-1111-4111-8111-111111111111"])
        .build();

      expect(mockQuery.contains).toHaveBeenCalledWith("readers", [
        "11111111-1111-4111-8111-111111111111",
      ]);
    });

    it("returns the builder instance to support method chaining", () => {
      const builder = new BookQueryBuilder(supabase, mockQuery as never);
      const returned = builder.withReaders([
        "22222222-2222-4222-8222-222222222222",
      ]);

      expect(returned).toBe(builder);
    });
  });

  describe("withStatus", () => {
    let mockQuery: ReturnType<typeof buildMockQuery>;
    let supabase: SupabaseClient<Database>;

    beforeEach(() => {
      mockQuery = buildMockQuery();
      supabase = buildMockSupabase(mockQuery);
    });

    it("filters by paused and abandoned statuses", () => {
      new BookQueryBuilder(supabase, mockQuery as never)
        .withStatus(["paused", "abandoned"])
        .build();

      expect(mockQuery.or).toHaveBeenCalledWith(
        "status.eq.paused,status.eq.abandoned",
      );
    });

    it("does not apply status filter when status list is empty", () => {
      new BookQueryBuilder(supabase, mockQuery as never).withStatus([]).build();

      expect(mockQuery.or).not.toHaveBeenCalled();
    });

    it("applies guard for planned filter including only scheduled not_started", () => {
      new BookQueryBuilder(supabase, mockQuery as never)
        .withStatus(["planned"])
        .build();

      expect(mockQuery.or).toHaveBeenCalledWith(
        "status.eq.planned,and(status.eq.not_started,planned_start_date.not.is.null)",
      );
    });

    it("keeps other statuses when planned is combined with additional filters", () => {
      new BookQueryBuilder(supabase, mockQuery as never)
        .withStatus(["finished", "planned"])
        .build();

      expect(mockQuery.or).toHaveBeenCalledWith(
        "status.eq.finished,status.eq.planned,and(status.eq.not_started,planned_start_date.not.is.null)",
      );
    });
  });

  describe("withReread", () => {
    let mockQuery: ReturnType<typeof buildMockQuery>;
    let supabase: SupabaseClient<Database>;

    beforeEach(() => {
      mockQuery = buildMockQuery();
      supabase = buildMockSupabase(mockQuery);
    });

    it("applies eq filter for is_reread when isReread is true", () => {
      new BookQueryBuilder(supabase, mockQuery as never)
        .withReread(true)
        .build();

      expect(mockQuery.eq).toHaveBeenCalledWith("is_reread", true);
    });

    it("does not apply filter when isReread is false", () => {
      new BookQueryBuilder(supabase, mockQuery as never)
        .withReread(false)
        .build();

      expect(mockQuery.eq).not.toHaveBeenCalled();
    });

    it("does not apply filter when isReread is undefined", () => {
      new BookQueryBuilder(supabase, mockQuery as never)
        .withReread(undefined)
        .build();

      expect(mockQuery.eq).not.toHaveBeenCalled();
    });

    it("returns the builder instance to support method chaining", () => {
      const builder = new BookQueryBuilder(supabase, mockQuery as never);
      const returned = builder.withReread(true);

      expect(returned).toBe(builder);
    });
  });

  describe("withYear", () => {
    let mockQuery: ReturnType<typeof buildMockQuery>;
    let supabase: SupabaseClient<Database>;

    beforeEach(() => {
      mockQuery = buildMockQuery();
      supabase = buildMockSupabase(mockQuery);
    });

    it("applies complex OR filter for planned_start_date and end_date when year is provided", () => {
      const year = 2024;
      const expectedQuery =
        `and(planned_start_date.gte.2024-01-01,planned_start_date.lte.2024-12-31),` +
        `and(end_date.gte.2024-01-01,end_date.lte.2024-12-31)`;

      new BookQueryBuilder(supabase, mockQuery as never).withYear(year).build();

      expect(mockQuery.or).toHaveBeenCalledWith(expectedQuery);
      expect(mockQuery.gte).not.toHaveBeenCalled();
      expect(mockQuery.lte).not.toHaveBeenCalled();
    });

    it("does not apply any date filter when year is undefined", () => {
      new BookQueryBuilder(supabase, mockQuery as never)
        .withYear(undefined)
        .build();

      expect(mockQuery.or).not.toHaveBeenCalled();
    });

    it("does not apply any date filter when year is 0", () => {
      new BookQueryBuilder(supabase, mockQuery as never).withYear(0).build();

      expect(mockQuery.or).not.toHaveBeenCalled();
    });

    it("returns the builder instance to support method chaining", () => {
      const builder = new BookQueryBuilder(supabase, mockQuery as never);
      const returned = builder.withYear(2024);

      expect(returned).toBe(builder);
    });

    it("chains correctly with pagination after applying the year filter", () => {
      const year = 2026;

      new BookQueryBuilder(supabase, mockQuery as never)
        .withYear(year)
        .withPagination(0, 8)
        .build();

      expect(mockQuery.or).toHaveBeenCalled();
      expect(mockQuery.range).toHaveBeenCalledWith(0, 7);
    });

    it("handles different years correctly in the query string", () => {
      const year = 2021;
      const expectedQuery =
        `and(planned_start_date.gte.2021-01-01,planned_start_date.lte.2021-12-31),` +
        `and(end_date.gte.2021-01-01,end_date.lte.2021-12-31)`;

      new BookQueryBuilder(supabase, mockQuery as never).withYear(year).build();

      expect(mockQuery.or).toHaveBeenCalledWith(expectedQuery);
    });
  });
});
