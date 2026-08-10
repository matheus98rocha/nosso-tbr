import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EstatisticaAnual } from "@/modules/stats/types/stats.types";

import { useStatsClient } from "./useStatsClient";

const routerPushMock = vi.fn();
const routerRefreshMock = vi.fn();
const useSearchParamsMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPushMock,
    replace: vi.fn(),
    prefetch: vi.fn(),
    refresh: routerRefreshMock,
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

const readerOptions = [
  { id: "reader-matheus", label: "Matheus" },
  { id: "reader-john-doe", label: "John Doe" },
];

describe("useStatsClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSearchParamsMock.mockReturnValue(new URLSearchParams());
  });

  it("defaults selected reader from query or first option", () => {
    useSearchParamsMock.mockReturnValue(
      new URLSearchParams("reader=reader-john-doe"),
    );

    const { result } = renderHook(() =>
      useStatsClient({
        yearlyStats: baseYearlyStats,
        collaborators: [{ readerName: "Matheus", booksRead: 2 }],
        readerOptions,
        selectedReaderId: "reader-john-doe",
      }),
    );

    expect(result.current.selectedReader).toBe("reader-john-doe");
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
        readerOptions,
        selectedReaderId: "reader-matheus",
      }),
    );

    expect(result.current.totalPagesAcrossYears).toBe(150);
  });

  it("navigates when reader changes", () => {
    const { result } = renderHook(() =>
      useStatsClient({
        yearlyStats: baseYearlyStats,
        collaborators: [],
        readerOptions,
        selectedReaderId: "reader-matheus",
      }),
    );

    act(() => {
      result.current.handleReaderChange("reader-john-doe");
    });

    expect(routerPushMock).toHaveBeenCalledWith(
      "/stats?reader=reader-john-doe",
    );
    expect(routerRefreshMock).toHaveBeenCalled();
  });

  it("exposes chart availability flags", () => {
    const { result: empty } = renderHook(() =>
      useStatsClient({
        yearlyStats: [],
        collaborators: [],
        readerOptions,
        selectedReaderId: "reader-matheus",
      }),
    );

    expect(empty.current.hasYearlyChartData).toBe(false);
    expect(empty.current.hasCollaborationChartData).toBe(false);

    const { result: filled } = renderHook(() =>
      useStatsClient({
        yearlyStats: baseYearlyStats,
        collaborators: [{ readerName: "X", booksRead: 1 }],
        readerOptions,
        selectedReaderId: "reader-matheus",
      }),
    );

    expect(filled.current.hasYearlyChartData).toBe(true);
    expect(filled.current.hasCollaborationChartData).toBe(true);
  });
});
