import { describe, expect, it } from "vitest";
import { normalizeForBookTitleSearch } from "./normalizeForBookTitleSearch";

describe("normalizeForBookTitleSearch", () => {
  it("returns empty string for empty input", () => {
    expect(normalizeForBookTitleSearch("")).toBe("");
    expect(normalizeForBookTitleSearch("   ")).toBe("");
  });

  it("removes leading articles so equivalent titles align", () => {
    const withArticle = normalizeForBookTitleSearch("O Senhor dos Anéis");
    const withoutArticle = normalizeForBookTitleSearch("Senhor dos Anéis");
    expect(withArticle).toBe(withoutArticle);
    expect(withArticle).toContain("senhor");
    expect(withArticle).toContain("aneis");
  });

  it("strips diacritics", () => {
    expect(normalizeForBookTitleSearch("Açúcar")).toBe("acucar");
  });

  it("returns empty when only stop words remain", () => {
    expect(normalizeForBookTitleSearch("o a de do")).toBe("");
  });

  it("collapses punctuation to spaces", () => {
    expect(normalizeForBookTitleSearch("foo, bar! Baz.")).toBe("foo bar baz");
  });
});
