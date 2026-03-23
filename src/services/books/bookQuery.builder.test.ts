import { describe, it, expect, vi, beforeEach } from "vitest";
import { BookQueryBuilder } from "./bookQuery.builder";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../database.types";

const buildMockQuery = () => ({
  contains: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  filter: vi.fn().mockReturnThis(),
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

    it("uses plainto_tsquery strategy (plfts) to avoid tsquery syntax errors", () => {
      new BookQueryBuilder(supabase, mockQuery as never)
        .withSearchTerm("Harry Potter e a Câmara Secreta")
        .build();

      expect(mockQuery.filter).toHaveBeenCalledWith(
        "search_vector",
        "plfts",
        "Harry Potter e a Câmara Secreta",
      );
    });

    it("sanitizes unsafe characters before applying search", () => {
      new BookQueryBuilder(supabase, mockQuery as never)
        .withSearchTerm("Harry: Potter!!!")
        .build();

      expect(mockQuery.filter).toHaveBeenCalledWith(
        "search_vector",
        "plfts",
        "Harry Potter",
      );
    });

    it("does not apply search when term is empty after sanitization", () => {
      new BookQueryBuilder(supabase, mockQuery as never)
        .withSearchTerm("***")
        .build();

      expect(mockQuery.filter).not.toHaveBeenCalled();
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
        .withReaders(["Matheus", "Fabi"])
        .build();

      expect(mockQuery.contains).toHaveBeenCalledWith(
        "readers",
        ["Fabi", "Matheus"],
      );
    });

    it("normalizes reader order so ['Matheus','Fabi'] and ['Fabi','Matheus'] produce the same query", () => {
      const mockQueryA = buildMockQuery();
      const mockQueryB = buildMockQuery();
      const supabaseA = buildMockSupabase(mockQueryA);
      const supabaseB = buildMockSupabase(mockQueryB);

      new BookQueryBuilder(supabaseA, mockQueryA as never)
        .withReaders(["Matheus", "Fabi"])
        .build();

      new BookQueryBuilder(supabaseB, mockQueryB as never)
        .withReaders(["Fabi", "Matheus"])
        .build();

      expect(mockQueryA.contains).toHaveBeenCalledWith("readers", [
        "Fabi",
        "Matheus",
      ]);
      expect(mockQueryB.contains).toHaveBeenCalledWith("readers", [
        "Fabi",
        "Matheus",
      ]);
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
        .withReaders(["Matheus"])
        .build();

      expect(mockQuery.contains).toHaveBeenCalledWith("readers", ["Matheus"]);
    });

    it("returns the builder instance to support method chaining", () => {
      const builder = new BookQueryBuilder(supabase, mockQuery as never);
      const returned = builder.withReaders(["Fabi"]);

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
