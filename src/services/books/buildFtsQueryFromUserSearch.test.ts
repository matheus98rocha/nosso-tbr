import { describe, expect, it } from "vitest";
import { buildFtsQueryFromUserSearch } from "./buildFtsQueryFromUserSearch";

describe("buildFtsQueryFromUserSearch", () => {
  it("returns null for empty or whitespace-only input", () => {
    expect(buildFtsQueryFromUserSearch(undefined)).toBeNull();
    expect(buildFtsQueryFromUserSearch("")).toBeNull();
    expect(buildFtsQueryFromUserSearch("   ")).toBeNull();
  });

  it("normalizes Outsider 1 for plainto_tsquery simple (digits and words)", () => {
    expect(buildFtsQueryFromUserSearch("Outsider 1")).toBe("outsider 1");
  });

  it("strips punctuation from Outsider sequel titles and keeps content words", () => {
    expect(buildFtsQueryFromUserSearch("Outsider: 1 - Holly Gibney")).toBe(
      "outsider 1 holly gibney",
    );
    expect(
      buildFtsQueryFromUserSearch("Outsider: 1 - (Holly Gibney)"),
    ).toBe("outsider 1 holly gibney");
  });

  it("removes Portuguese stop words so O senhor dos Aneis matches senhor + aneis", () => {
    expect(buildFtsQueryFromUserSearch("O senhor dos Aneis")).toBe(
      "senhor aneis",
    );
    expect(buildFtsQueryFromUserSearch("O Senhor dos Anéis")).toBe(
      "senhor aneis",
    );
  });

  it("returns null when only stop words remain", () => {
    expect(buildFtsQueryFromUserSearch("o a de")).toBeNull();
  });
});
