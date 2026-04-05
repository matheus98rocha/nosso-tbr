import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useStatsClient } from "./useStatsClient";
import type { EstatisticaAnual } from "@/modules/stats/types/stats.types";

const routerPushMock = vi.fn();
const useSearchParamsMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPushMock,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => useSearchParamsMock(),
}));

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
  beforeEach(() => {
    vi.clearAllMocks();
    useSearchParamsMock.mockReturnValue(new URLSearchParams());
  });

  it("defaults selected reader from query or first option", () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams("reader=Fabi"));

    const { result } = renderHook(() =>
      useStatsClient({
        yearlyStats: baseYearlyStats,
        collaborators: [{ readerName: "Matheus", booksRead: 2 }],
      }),
    );

    expect(result.current.selectedReader).toBe("Fabi");
  });

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

  it("navigates when reader changes", () => {
    const { result } = renderHook(() =>
      useStatsClient({
        yearlyStats: baseYearlyStats,
        collaborators: [],
      }),
    );

    act(() => {
      result.current.handleReaderChange("Barbara");
    });

    expect(routerPushMock).toHaveBeenCalledWith("/stats?reader=Barbara");
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
