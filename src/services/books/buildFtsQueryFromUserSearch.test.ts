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

  it("preserves dotted initials so plainto_tsquery matches host lexemes like j.r.r", () => {
    expect(buildFtsQueryFromUserSearch("J.R.R Tolkien")).toBe("j.r.r tolkien");
    expect(buildFtsQueryFromUserSearch("J.R.R. Tolkien")).toBe("j.r.r. tolkien");
  });

  it("preserves a single dotted initial before the surname", () => {
    expect(buildFtsQueryFromUserSearch("J. Tolkien")).toBe("j. tolkien");
  });

  it("keeps dots while stripping other punctuation around initials", () => {
    expect(buildFtsQueryFromUserSearch("J.R.R., Tolkien")).toBe(
      "j.r.r. tolkien",
    );
  });

  it("preserves dots in volume-style tokens used by plainto_tsquery simple", () => {
    expect(buildFtsQueryFromUserSearch("Vol. 2")).toBe("vol. 2");
  });

  describe("dotted initials edge cases", () => {
    it("preserves initials wrapped in parentheses or quotes", () => {
      expect(buildFtsQueryFromUserSearch("(J.R.R.) Tolkien")).toBe(
        "j.r.r. tolkien",
      );
      expect(buildFtsQueryFromUserSearch('"J.R.R." Tolkien')).toBe(
        "j.r.r. tolkien",
      );
    });

    it("preserves two-letter author initials like C.S. Lewis", () => {
      expect(buildFtsQueryFromUserSearch("C.S. Lewis")).toBe("c.s. lewis");
    });

    it("keeps already-lowercased dotted initials unchanged", () => {
      expect(buildFtsQueryFromUserSearch("j.r.r tolkien")).toBe(
        "j.r.r tolkien",
      );
    });

    it("strips diacritics from surname while keeping dotted initials", () => {
      expect(buildFtsQueryFromUserSearch("J.R.R. Tolkién")).toBe(
        "j.r.r. tolkien",
      );
    });

    it("keeps initials and title words in mixed author-title searches", () => {
      expect(buildFtsQueryFromUserSearch("Hobbit J.R.R Tolkien")).toBe(
        "hobbit j.r.r tolkien",
      );
    });

    it("returns dotted initials alone when surname is omitted", () => {
      expect(buildFtsQueryFromUserSearch("J.R.R.")).toBe("j.r.r.");
    });

    it("collapses initials glued to surname into one dotted token", () => {
      expect(buildFtsQueryFromUserSearch("J.R.R.Tolkien")).toBe(
        "j.r.r.tolkien",
      );
    });
  });
});
