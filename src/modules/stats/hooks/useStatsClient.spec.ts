import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { EstatisticaAnual } from "@/modules/stats/types/stats.types";

import { useStatsClient } from "./useStatsClient";

const baseYearlyStats: EstatisticaAnual[] = [
  {
    year: 2024,
    totalBooks: 5,
    totalPages: 1200,
    mostReadGenre: "fiction",
    mostReadAuthor: "Author A",
  },
];

describe("useStatsClient", () => {
  it("computes total pages across years", () => {
    const { result } = renderHook(() =>
      useStatsClient({
        yearlyStats: [
          { ...baseYearlyStats[0], totalPages: 100 },
          {
            year: 2023,
            totalBooks: 2,
            totalPages: 50,
            mostReadGenre: "x",
            mostReadAuthor: "y",
          },
        ],
        collaborators: [],
      }),
    );

    expect(result.current.totalPagesAcrossYears).toBe(150);
  });

  it("exposes chart availability flags", () => {
    const { result: empty } = renderHook(() =>
      useStatsClient({
        yearlyStats: [],
        collaborators: [],
      }),
    );

    expect(empty.current.hasYearlyChartData).toBe(false);
    expect(empty.current.hasCollaborationChartData).toBe(false);

    const { result: filled } = renderHook(() =>
      useStatsClient({
        yearlyStats: baseYearlyStats,
        collaborators: [{ readerName: "X", booksRead: 1 }],
      }),
    );

    expect(filled.current.hasYearlyChartData).toBe(true);
    expect(filled.current.hasCollaborationChartData).toBe(true);
  });
});
