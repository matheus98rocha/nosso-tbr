import { describe, it, expect } from "vitest";
import { buildQueryStringFromFilters } from "./buildQueryStringFromFilters";
import { FiltersOptions } from "@/types/filters";

const baseFilters: FiltersOptions = {
  readers: [],
  status: [],
  gender: [],
};

describe("buildQueryStringFromFilters", () => {
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
