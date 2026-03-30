import { describe, it, expect } from "vitest";
import { QUERY_KEYS, INITIAL_FILTERS } from "./keys";

describe("QUERY_KEYS.books.list", () => {
  describe("readers array normalization (RN18)", () => {
    it("produces the same key for reader id permutations", () => {
      const a = "11111111-1111-4111-8111-111111111111";
      const b = "22222222-2222-4222-8222-222222222222";
      const keyA = QUERY_KEYS.books.list(
        { ...INITIAL_FILTERS, readers: [a, b] },
        "",
        0,
      );
      const keyB = QUERY_KEYS.books.list(
        { ...INITIAL_FILTERS, readers: [b, a] },
        "",
        0,
      );

      expect(JSON.stringify(keyA)).toBe(JSON.stringify(keyB));
    });

    it("produces the same key for three reader ids in any order", () => {
      const a = "11111111-1111-4111-8111-111111111111";
      const b = "22222222-2222-4222-8222-222222222222";
      const c = "33333333-3333-4333-8333-333333333333";
      const keyA = QUERY_KEYS.books.list(
        { ...INITIAL_FILTERS, readers: [c, b, a] },
        "",
        0,
      );
      const keyB = QUERY_KEYS.books.list(
        { ...INITIAL_FILTERS, readers: [a, c, b] },
        "",
        0,
      );
      const keyC = QUERY_KEYS.books.list(
        { ...INITIAL_FILTERS, readers: [b, a, c] },
        "",
        0,
      );

      expect(JSON.stringify(keyA)).toBe(JSON.stringify(keyB));
      expect(JSON.stringify(keyB)).toBe(JSON.stringify(keyC));
    });

    it("produces different keys for different reader subsets", () => {
      const a = "11111111-1111-4111-8111-111111111111";
      const b = "22222222-2222-4222-8222-222222222222";
      const keyOnlyMatheus = QUERY_KEYS.books.list(
        { ...INITIAL_FILTERS, readers: [a] },
        "",
        0,
      );
      const keyBoth = QUERY_KEYS.books.list(
        { ...INITIAL_FILTERS, readers: [a, b] },
        "",
        0,
      );

      expect(JSON.stringify(keyOnlyMatheus)).not.toBe(JSON.stringify(keyBoth));
    });
  });

  describe("status array normalization (RN18)", () => {
    it("produces the same key for status in any order", () => {
      const keyA = QUERY_KEYS.books.list(
        { ...INITIAL_FILTERS, status: ["reading", "finished"] },
        "",
        0,
      );
      const keyB = QUERY_KEYS.books.list(
        { ...INITIAL_FILTERS, status: ["finished", "reading"] },
        "",
        0,
      );

      expect(JSON.stringify(keyA)).toBe(JSON.stringify(keyB));
    });
  });

  describe("gender array normalization (RN18)", () => {
    it("produces the same key for gender in any order", () => {
      const keyA = QUERY_KEYS.books.list(
        { ...INITIAL_FILTERS, gender: ["Romance", "Fantasia"] },
        "",
        0,
      );
      const keyB = QUERY_KEYS.books.list(
        { ...INITIAL_FILTERS, gender: ["Fantasia", "Romance"] },
        "",
        0,
      );

      expect(JSON.stringify(keyA)).toBe(JSON.stringify(keyB));
    });
  });

  describe("key differentiation by other params", () => {
    it("produces different keys for different view filters", () => {
      const keyTodos = QUERY_KEYS.books.list(
        { ...INITIAL_FILTERS, view: "todos" },
        "",
        0,
      );
      const keyJoint = QUERY_KEYS.books.list(
        { ...INITIAL_FILTERS, view: "joint" },
        "",
        0,
      );

      expect(JSON.stringify(keyTodos)).not.toBe(JSON.stringify(keyJoint));
    });

    it("produces different keys for different search terms", () => {
      const keyA = QUERY_KEYS.books.list(INITIAL_FILTERS, "harry", 0);
      const keyB = QUERY_KEYS.books.list(INITIAL_FILTERS, "potter", 0);

      expect(JSON.stringify(keyA)).not.toBe(JSON.stringify(keyB));
    });

    it("produces different keys for different pages", () => {
      const keyA = QUERY_KEYS.books.list(INITIAL_FILTERS, "", 0);
      const keyB = QUERY_KEYS.books.list(INITIAL_FILTERS, "", 1);

      expect(JSON.stringify(keyA)).not.toBe(JSON.stringify(keyB));
    });

    it("produces different keys for different userIds", () => {
      const keyA = QUERY_KEYS.books.list(INITIAL_FILTERS, "", 0, "user-1");
      const keyB = QUERY_KEYS.books.list(INITIAL_FILTERS, "", 0, "user-2");

      expect(JSON.stringify(keyA)).not.toBe(JSON.stringify(keyB));
    });
  });
});
