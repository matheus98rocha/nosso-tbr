import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReadingRankingTable } from "./readingRankingTable";
import type { ReadingLeaderboardEntryDomain } from "@/modules/stats/types/stats.types";

const rows: ReadingLeaderboardEntryDomain[] = [
  {
    readerId: "a",
    displayName: "Reader A",
    booksRead: 10,
    totalPages: 100,
    rank: 1,
  },
  {
    readerId: "b",
    displayName: "Reader B",
    booksRead: 5,
    totalPages: 50,
    rank: 2,
  },
];

describe("ReadingRankingTable", () => {
  it("renders all rows with ranks and names", () => {
    render(<ReadingRankingTable rows={rows} metric="books" expandOnPage />);

    const region = screen.getByRole("region", {
      name: "Classificação completa do ranking",
    });
    expect(within(region).getByText("Reader A")).toBeInTheDocument();
    expect(within(region).getByText("Reader B")).toBeInTheDocument();
    expect(within(region).getAllByRole("row")).toHaveLength(3);
  });
});
