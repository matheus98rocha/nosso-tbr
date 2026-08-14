import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReadingRankingSection } from "./readingRankingSection";
import { useReadingRanking } from "@/modules/stats/hooks/useReadingRanking";
import type { ReadingLeaderboardEntryDomain } from "@/modules/stats/types/stats.types";

vi.mock("@/modules/stats/hooks/useReadingRanking", () => ({
  useReadingRanking: vi.fn(),
}));

const mockRanked: ReadingLeaderboardEntryDomain[] = [
  {
    readerId: "1",
    displayName: "First",
    booksRead: 3,
    totalPages: 30,
    rank: 1,
  },
  {
    readerId: "2",
    displayName: "Second",
    booksRead: 2,
    totalPages: 20,
    rank: 2,
  },
];

describe("ReadingRankingSection", () => {
  beforeEach(() => {
    vi.mocked(useReadingRanking).mockReturnValue({
      ranked: mockRanked,
      selectedYear: undefined,
      yearOptions: [2026, 2025],
      metric: "books",
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      handleSelectYear: vi.fn(),
      handleSetMetric: vi.fn(),
    });
  });

  it("renders full classification with all reader rows", () => {
    render(<ReadingRankingSection />);

    expect(
      screen.getByRole("heading", { name: "Classificação completa" }),
    ).toBeInTheDocument();
    const table = screen.getByRole("table");
    expect(within(table).getByText("First")).toBeInTheDocument();
    expect(within(table).getByText("Second")).toBeInTheDocument();
  });
});
