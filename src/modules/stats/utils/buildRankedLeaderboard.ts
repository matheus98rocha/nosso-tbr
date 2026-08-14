import type {
  ReadingLeaderboardEntryDomain,
  ReadingRankingMetric,
} from "@/modules/stats/types/stats.types";

export type LeaderboardRowWithoutRank = Omit<
  ReadingLeaderboardEntryDomain,
  "rank"
>;

export function buildRankedLeaderboard(
  baseRows: LeaderboardRowWithoutRank[] | undefined,
  metric: ReadingRankingMetric,
): ReadingLeaderboardEntryDomain[] {
  if (!baseRows?.length) return [];

  const sorted = [...baseRows].sort((a, b) => {
    if (metric === "pages") {
      const dp = b.totalPages - a.totalPages;
      if (dp !== 0) return dp;
      return b.booksRead - a.booksRead;
    }
    const db = b.booksRead - a.booksRead;
    if (db !== 0) return db;
    return b.totalPages - a.totalPages;
  });

  return sorted.map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}
