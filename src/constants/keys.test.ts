import { describe, it, expect } from "vitest";
import { QUERY_KEYS, INITIAL_FILTERS } from "./keys";

describe("QUERY_KEYS.books.list", () => {
  describe("readers array normalization (RN18)", () => {
    it("produces the same key for ['Matheus','Fabi'] and ['Fabi','Matheus']", () => {
      const keyA = QUERY_KEYS.books.list(
        { ...INITIAL_FILTERS, readers: ["Matheus", "Fabi"] },
        "",
        0,
      );
      const keyB = QUERY_KEYS.books.list(
        { ...INITIAL_FILTERS, readers: ["Fabi", "Matheus"] },
        "",
        0,
      );

      expect(JSON.stringify(keyA)).toBe(JSON.stringify(keyB));
    });

    it("produces the same key for ['Barbara','Fabi','Matheus'] in any order", () => {
      const keyA = QUERY_KEYS.books.list(
        { ...INITIAL_FILTERS, readers: ["Barbara", "Fabi", "Matheus"] },
        "",
        0,
      );
      const keyB = QUERY_KEYS.books.list(
        { ...INITIAL_FILTERS, readers: ["Matheus", "Barbara", "Fabi"] },
        "",
        0,
      );
      const keyC = QUERY_KEYS.books.list(
        { ...INITIAL_FILTERS, readers: ["Fabi", "Matheus", "Barbara"] },
        "",
        0,
      );

      expect(JSON.stringify(keyA)).toBe(JSON.stringify(keyB));
      expect(JSON.stringify(keyB)).toBe(JSON.stringify(keyC));
    });

    it("produces different keys for different reader subsets", () => {
      const keyOnlyMatheus = QUERY_KEYS.books.list(
        { ...INITIAL_FILTERS, readers: ["Matheus"] },
        "",
        0,
      );
      const keyBoth = QUERY_KEYS.books.list(
        { ...INITIAL_FILTERS, readers: ["Matheus", "Fabi"] },
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
