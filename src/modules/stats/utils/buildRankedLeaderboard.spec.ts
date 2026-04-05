import { describe, expect, it } from "vitest";
import { buildRankedLeaderboard } from "./buildRankedLeaderboard";

const row = (
  overrides: Partial<{
    readerId: string;
    displayName: string;
    booksRead: number;
    totalPages: number;
  }> = {},
) => ({
  readerId: "r1",
  displayName: "Reader",
  booksRead: 2,
  totalPages: 100,
  ...overrides,
});

describe("buildRankedLeaderboard", () => {
  it("returns empty array for undefined or empty input", () => {
    expect(buildRankedLeaderboard(undefined, "books")).toEqual([]);
    expect(buildRankedLeaderboard([], "pages")).toEqual([]);
  });

  it("assigns ranks 1..n in sort order for books metric", () => {
    const ranked = buildRankedLeaderboard(
      [
        row({ readerId: "a", booksRead: 3, totalPages: 10 }),
        row({ readerId: "b", booksRead: 1, totalPages: 99 }),
        row({ readerId: "c", booksRead: 2, totalPages: 50 }),
      ],
      "books",
    );

    expect(ranked.map((r) => r.readerId)).toEqual(["a", "c", "b"]);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it("breaks ties on books metric by higher total pages", () => {
    const ranked = buildRankedLeaderboard(
      [
        row({ readerId: "a", booksRead: 5, totalPages: 100 }),
        row({ readerId: "b", booksRead: 5, totalPages: 200 }),
      ],
      "books",
    );

    expect(ranked.map((r) => r.readerId)).toEqual(["b", "a"]);
  });

  it("sorts by total pages when metric is pages", () => {
    const ranked = buildRankedLeaderboard(
      [
        row({ readerId: "a", booksRead: 10, totalPages: 50 }),
        row({ readerId: "b", booksRead: 1, totalPages: 300 }),
      ],
      "pages",
    );

    expect(ranked.map((r) => r.readerId)).toEqual(["b", "a"]);
  });

  it("breaks ties on pages metric by higher books read", () => {
    const ranked = buildRankedLeaderboard(
      [
        row({ readerId: "a", booksRead: 2, totalPages: 100 }),
        row({ readerId: "b", booksRead: 5, totalPages: 100 }),
      ],
      "pages",
    );

    expect(ranked.map((r) => r.readerId)).toEqual(["b", "a"]);
  });
});
