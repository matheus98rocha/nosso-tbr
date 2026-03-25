import { describe, it, expect } from "vitest";
import { buildQueryStringFromFilters } from "./buildQueryStringFromFilters";
import { FiltersOptions } from "@/types/filters";

const baseFilters: FiltersOptions = {
  readers: [],
  status: [],
  gender: [],
  view: "todos",
};

describe("buildQueryStringFromFilters", () => {
  describe("view serialization", () => {
    it("serializes view when joint is selected", () => {
      const params = new URLSearchParams(
        buildQueryStringFromFilters({ ...baseFilters, view: "joint" }),
      );

      expect(params.get("view")).toBe("joint");
    });

    it('does not serialize view when "todos" is selected', () => {
      const params = new URLSearchParams(
        buildQueryStringFromFilters({ ...baseFilters, view: "todos" }),
      );

      expect(params.get("view")).toBeNull();
    });
  });

  describe("year serialization", () => {
    it("appends year param when year is provided", () => {
      const result = buildQueryStringFromFilters({ ...baseFilters, year: 2024 });
      const params = new URLSearchParams(result);
      expect(params.get("year")).toBe("2024");
    });

    it("does not append year param when year is undefined", () => {
      const result = buildQueryStringFromFilters({ ...baseFilters, year: undefined });
      const params = new URLSearchParams(result);
      expect(params.get("year")).toBeNull();
    });

    it("does not append year param when year is 0", () => {
      const result = buildQueryStringFromFilters({ ...baseFilters, year: 0 });
      const params = new URLSearchParams(result);
      expect(params.get("year")).toBeNull();
    });

    it("preserves other filters alongside year", () => {
      const filters: FiltersOptions = {
        ...baseFilters,
        status: ["finished"],
        year: 2023,
      };
      const result = buildQueryStringFromFilters(filters, "clean code");
      const params = new URLSearchParams(result);
      expect(params.get("year")).toBe("2023");
      expect(params.get("status")).toBe("finished");
      expect(params.get("search")).toBe("clean code");
    });

    it("produces a round-trip consistent string for year", () => {
      const filters: FiltersOptions = { ...baseFilters, year: 2025 };
      const qs = buildQueryStringFromFilters(filters);
      const params = new URLSearchParams(qs);
      expect(Number(params.get("year"))).toBe(2025);
    });
  });

  describe("myBooks serialization", () => {
    it("appends myBooks param when myBooks is true", () => {
      const result = buildQueryStringFromFilters({ ...baseFilters, myBooks: true });
      const params = new URLSearchParams(result);
      expect(params.get("myBooks")).toBe("true");
    });

    it("does not append myBooks param when myBooks is false", () => {
      const result = buildQueryStringFromFilters({ ...baseFilters, myBooks: false });
      const params = new URLSearchParams(result);
      expect(params.get("myBooks")).toBeNull();
    });

    it("does not append myBooks param when myBooks is undefined", () => {
      const result = buildQueryStringFromFilters({ ...baseFilters });
      const params = new URLSearchParams(result);
      expect(params.get("myBooks")).toBeNull();
    });

    it("preserves other filters alongside myBooks", () => {
      const filters: FiltersOptions = {
        ...baseFilters,
        status: ["finished"],
        myBooks: true,
        year: 2024,
      };
      const result = buildQueryStringFromFilters(filters);
      const params = new URLSearchParams(result);
      expect(params.get("myBooks")).toBe("true");
      expect(params.get("status")).toBe("finished");
      expect(params.get("year")).toBe("2024");
    });
  });

  describe("existing filters without year", () => {
    it("returns empty string when all inputs are empty", () => {
      expect(buildQueryStringFromFilters(baseFilters)).toBe("");
    });

    it("serializes readers correctly", () => {
      const filters: FiltersOptions = { ...baseFilters, readers: ["Alice", "Bob"] };
      const params = new URLSearchParams(buildQueryStringFromFilters(filters));
      expect(params.get("readers")).not.toBeNull();
    });
  });
});
