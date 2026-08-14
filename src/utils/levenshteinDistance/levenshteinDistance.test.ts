import { describe, expect, it } from "vitest";
import { levenshteinDistance } from "./levenshteinDistance";

describe("levenshteinDistance", () => {
  it("returns 0 for two empty strings", () => {
    expect(levenshteinDistance("", "")).toBe(0);
  });

  it("returns length of other string when one side is empty", () => {
    expect(levenshteinDistance("", "abc")).toBe(3);
    expect(levenshteinDistance("abc", "")).toBe(3);
  });

  it("returns 0 for identical strings", () => {
    expect(levenshteinDistance("senhor", "senhor")).toBe(0);
  });

  it("counts single substitution", () => {
    expect(levenshteinDistance("senhor", "senhox")).toBe(1);
  });

  it("counts single insertion", () => {
    expect(levenshteinDistance("senhor", "senhors")).toBe(1);
  });

  it("counts single deletion", () => {
    expect(levenshteinDistance("senhor", "senho")).toBe(1);
  });

  it("matches classic kitten vs sitting distance", () => {
    expect(levenshteinDistance("kitten", "sitting")).toBe(3);
  });
});
