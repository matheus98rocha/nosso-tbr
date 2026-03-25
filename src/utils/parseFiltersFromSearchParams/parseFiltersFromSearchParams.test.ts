import { describe, it, expect } from "vitest";
import { parseFiltersFromSearchParams } from "./parseFiltersFromSearchParams";

const buildParams = (entries: Record<string, string>) =>
  new URLSearchParams(entries);

describe("parseFiltersFromSearchParams", () => {
  describe("view parsing", () => {
    it('defaults view to "todos" when param is absent', () => {
      const { filters } = parseFiltersFromSearchParams(buildParams({}));
      expect(filters.view).toBe("todos");
    });

    it('parses view=joint when explicitly informed', () => {
      const { filters } = parseFiltersFromSearchParams(buildParams({ view: "joint" }));
      expect(filters.view).toBe("joint");
    });
  });

  describe("year parsing", () => {
    it("parses a valid year param as a number", () => {
      const params = buildParams({ year: "2024" });
      const { filters } = parseFiltersFromSearchParams(params);
      expect(filters.year).toBe(2024);
    });

    it("returns undefined when year param is absent", () => {
      const params = buildParams({});
      const { filters } = parseFiltersFromSearchParams(params);
      expect(filters.year).toBeUndefined();
    });

    it("parses the current year correctly", () => {
      const currentYear = new Date().getFullYear();
      const params = buildParams({ year: String(currentYear) });
      const { filters } = parseFiltersFromSearchParams(params);
      expect(filters.year).toBe(currentYear);
    });

    it("returns NaN for a non-numeric year string", () => {
      const params = buildParams({ year: "abc" });
      const { filters } = parseFiltersFromSearchParams(params);
      expect(Number.isNaN(filters.year)).toBe(true);
    });
  });

  describe("myBooks parsing", () => {
    it("parses myBooks=true as boolean true", () => {
      const params = buildParams({ myBooks: "true" });
      const { filters } = parseFiltersFromSearchParams(params);
      expect(filters.myBooks).toBe(true);
    });

    it("returns false when myBooks param is absent", () => {
      const params = buildParams({});
      const { filters } = parseFiltersFromSearchParams(params);
      expect(filters.myBooks).toBe(false);
    });

    it("returns false for non-true myBooks value", () => {
      const params = buildParams({ myBooks: "false" });
      const { filters } = parseFiltersFromSearchParams(params);
      expect(filters.myBooks).toBe(false);
    });
  });

  describe("existing fields are preserved when year is present", () => {
    it("parses status, gender and year together", () => {
      const params = buildParams({
        status: "finished,reading",
        gender: "fiction",
        year: "2022",
      });
      const { filters } = parseFiltersFromSearchParams(params);
      expect(filters.status).toEqual(["finished", "reading"]);
      expect(filters.gender).toEqual(["fiction"]);
      expect(filters.year).toBe(2022);
    });

    it("returns empty arrays for list params and undefined year when params are empty", () => {
      const { filters, searchQuery } = parseFiltersFromSearchParams(buildParams({}));
      expect(filters.readers).toEqual([]);
      expect(filters.status).toEqual([]);
      expect(filters.gender).toEqual([]);
      expect(filters.year).toBeUndefined();
      expect(searchQuery).toBe("");
    });
  });

  describe("round-trip consistency with buildQueryStringFromFilters", () => {
    it("year survives a serialize → parse round-trip", async () => {
      const { buildQueryStringFromFilters } = await import(
        "@/utils/buildQueryStringFromFilters/buildQueryStringFromFilters"
      );
      const original = { readers: [], status: [], gender: [], year: 2026 };
      const qs = buildQueryStringFromFilters(original);
      const { filters } = parseFiltersFromSearchParams(new URLSearchParams(qs));
      expect(filters.year).toBe(2026);
    });
  });
});
