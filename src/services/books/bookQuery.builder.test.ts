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
  describe("withYear", () => {
    let mockQuery: ReturnType<typeof buildMockQuery>;
    let supabase: SupabaseClient<Database>;

    beforeEach(() => {
      mockQuery = buildMockQuery();
      supabase = buildMockSupabase(mockQuery);
    });

    it("applies gte and lte on end_date when a valid year is provided", () => {
      new BookQueryBuilder(supabase, mockQuery as never)
        .withYear(2024)
        .build();

      expect(mockQuery.gte).toHaveBeenCalledWith("end_date", "2024-01-01");
      expect(mockQuery.lte).toHaveBeenCalledWith("end_date", "2024-12-31");
    });

    it("does not apply any date filter when year is undefined", () => {
      new BookQueryBuilder(supabase, mockQuery as never)
        .withYear(undefined)
        .build();

      expect(mockQuery.gte).not.toHaveBeenCalled();
      expect(mockQuery.lte).not.toHaveBeenCalled();
    });

    it("does not apply any date filter when year is 0", () => {
      new BookQueryBuilder(supabase, mockQuery as never)
        .withYear(0)
        .build();

      expect(mockQuery.gte).not.toHaveBeenCalled();
      expect(mockQuery.lte).not.toHaveBeenCalled();
    });

    it("generates correct ISO boundaries for the start of the century", () => {
      new BookQueryBuilder(supabase, mockQuery as never)
        .withYear(2000)
        .build();

      expect(mockQuery.gte).toHaveBeenCalledWith("end_date", "2000-01-01");
      expect(mockQuery.lte).toHaveBeenCalledWith("end_date", "2000-12-31");
    });

    it("calls gte before lte to preserve filter order", () => {
      const callOrder: string[] = [];
      mockQuery.gte.mockImplementation(() => { callOrder.push("gte"); return mockQuery; });
      mockQuery.lte.mockImplementation(() => { callOrder.push("lte"); return mockQuery; });

      new BookQueryBuilder(supabase, mockQuery as never)
        .withYear(2025)
        .build();

      expect(callOrder).toEqual(["gte", "lte"]);
    });

    it("returns the builder instance to support method chaining", () => {
      const builder = new BookQueryBuilder(supabase, mockQuery as never);
      const returned = builder.withYear(2024);
      expect(returned).toBe(builder);
    });

    it("chains correctly with other builder methods", () => {
      new BookQueryBuilder(supabase, mockQuery as never)
        .withYear(2024)
        .withPagination(0, 10)
        .build();

      expect(mockQuery.gte).toHaveBeenCalled();
      expect(mockQuery.lte).toHaveBeenCalled();
      expect(mockQuery.range).toHaveBeenCalledWith(0, 9);
    });
  });
});
