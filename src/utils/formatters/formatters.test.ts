import { describe, it, expect, vi, beforeEach } from "vitest";

describe("formatters", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe("formatList", () => {
    it("returns single item as-is", async () => {
      const { formatList } = await import("./formatters");
      expect(formatList(["onlyOne"])).toBe("onlyOne");
    });

    it("joins two items with 'e'", async () => {
      const { formatList } = await import("./formatters");
      expect(formatList(["A", "B"])).toBe("A e B");
    });

    it("joins multiple items with commas and 'e' before the last", async () => {
      const { formatList } = await import("./formatters");
      expect(formatList(["A", "B", "C"])).toBe("A, B e C");
      expect(formatList(["A", "B", "C", "D"])).toBe("A, B, C e D");
    });

    it("handles empty strings gracefully", async () => {
      const { formatList } = await import("./formatters");
      expect(formatList(["", "B"])).toBe(" e B");
    });

    it("does not mutate the original array", async () => {
      const { formatList } = await import("./formatters");
      const arr = ["A", "B", "C"];
      const copy = [...arr];
      formatList(arr);
      expect(arr).toEqual(copy);
    });
  });

  describe("formatGenres", () => {
    it("returns null for undefined, null and empty array", async () => {
      vi.doMock("@/constants/genders", () => ({ genders: [] }));
      vi.doMock("@/constants/statusDictionary", () => ({
        STATUS_DICTIONARY: {},
      }));

      const { formatGenres } = await import("./formatters");
      expect(formatGenres(undefined)).toBeNull();
      expect(formatGenres(null)).toBeNull();
      expect(formatGenres([])).toBeNull();
    });

    it("maps gender values to labels and formats them", async () => {
      vi.doMock("@/constants/genders", () => ({
        genders: [
          { value: "sci-fi", label: "Science Fiction" },
          { value: "fant", label: "Fantasy" },
        ],
      }));
      vi.doMock("@/constants/statusDictionary", () => ({
        STATUS_DICTIONARY: {},
      }));

      const { formatGenres } = await import("./formatters");

      const input = ["sci-fi", "fant"];
      const copy = [...input];
      const result = formatGenres(input);

      expect(result).toBe("Science Fiction e Fantasy");
      expect(input).toEqual(copy);
    });

    it("falls back to raw value when no label found", async () => {
      vi.doMock("@/constants/genders", () => ({
        genders: [{ value: "poetry", label: "Poetry" }],
      }));
      vi.doMock("@/constants/statusDictionary", () => ({
        STATUS_DICTIONARY: {},
      }));

      const { formatGenres } = await import("./formatters");

      const result = formatGenres(["poetry", "unknown-genre"]);
      expect(result).toBe("Poetry e unknown-genre");
    });
  });

  describe("formatReaders", () => {
    it("returns null for invalid inputs and formats valid arrays", async () => {
      vi.doMock("@/constants/genders", () => ({ genders: [] }));
      vi.doMock("@/constants/statusDictionary", () => ({
        STATUS_DICTIONARY: {},
      }));

      const { formatReaders } = await import("./formatters");

      expect(formatReaders(undefined)).toBeNull();
      expect(formatReaders(null)).toBeNull();
      expect(formatReaders([])).toBeNull();

      const readers = ["Alice", "Bob", "Charlie"];
      const copy = [...readers];
      const res = formatReaders(readers);
      expect(res).toBe("Alice, Bob e Charlie");
      expect(readers).toEqual(copy);
    });
  });

  describe("formatStatus", () => {
    it("returns null for invalid inputs and maps using STATUS_DICTIONARY with quotes", async () => {
      vi.doMock("@/constants/genders", () => ({ genders: [] }));
      vi.doMock("@/constants/statusDictionary", () => ({
        STATUS_DICTIONARY: { reading: "Reading", finished: "Finished" },
      }));

      const { formatStatus } = await import("./formatters");

      expect(formatStatus(undefined)).toBeNull();
      expect(formatStatus(null)).toBeNull();
      expect(formatStatus([])).toBeNull();

      const input = ["reading", "finished"];
      const result = formatStatus(input);
      expect(result).toBe('"Reading" e "Finished"');
    });

    it("falls back to raw value when dictionary mapping is missing", async () => {
      vi.doMock("@/constants/genders", () => ({ genders: [] }));
      vi.doMock("@/constants/statusDictionary", () => ({
        STATUS_DICTIONARY: { reading: "Reading" },
      }));

      const { formatStatus } = await import("./formatters");

      const result = formatStatus(["reading", "unknown"]);
      expect(result).toBe('"Reading" e "unknown"');
    });
  });

  describe("robustness and edge cases", () => {
    it("handles quotes and commas correctly", async () => {
      vi.doMock("@/constants/genders", () => ({
        genders: [{ value: "weird", label: 'He said "hi"' }],
      }));
      vi.doMock("@/constants/statusDictionary", () => ({
        STATUS_DICTIONARY: { s1: "Value,With,Comma" },
      }));

      const { formatGenres, formatStatus } = await import("./formatters");

      const g = formatGenres(["weird"]);
      expect(g).not.toBeNull();
      expect(g).toBe('He said "hi"');

      const s = formatStatus(["s1"]);
      expect(s).not.toBeNull();
      expect(s).toBe('"Value,With,Comma"');
    });

    it("works with large arrays and does not mutate input", async () => {
      const large = Array.from({ length: 2000 }, (_, i) => `v${i}`);
      vi.doMock("@/constants/genders", () => ({
        genders: large.map((v, i) => ({ value: v, label: `L${i}` })),
      }));
      vi.doMock("@/constants/statusDictionary", () => ({
        STATUS_DICTIONARY: large.reduce((acc, v, i) => {
          acc[v] = `S${i}`;
          return acc;
        }, {} as Record<string, string>),
      }));

      const { formatGenres, formatStatus } = await import("./formatters");

      const inputGenres = large.slice(0, 100);
      const inputStatus = large.slice(0, 100);
      const copyGenres = [...inputGenres];
      const copyStatus = [...inputStatus];

      const g = formatGenres(inputGenres);
      const s = formatStatus(inputStatus);

      expect(g).toContain("L0");
      expect(s).toContain("S0");
      expect(inputGenres).toEqual(copyGenres);
      expect(inputStatus).toEqual(copyStatus);
    });
  });
});
