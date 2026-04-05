import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useQuery } from "@tanstack/react-query";
import { useReadingYears } from "@/hooks/useReadingYears";
import { ApiError } from "@/lib/api/clientJsonFetch";
import { toast } from "sonner";
import { useReadingRanking } from "./useReadingRanking";

const routerPushMock = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

vi.mock("@/hooks/useReadingYears", () => ({
  useReadingYears: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPushMock,
  }),
}));

vi.mock("sonner", () => ({
  toast: vi.fn(),
}));

const mockUseQuery = vi.mocked(useQuery);
const mockUseReadingYears = vi.mocked(useReadingYears);

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

function baseQueryResult(
  overrides: Partial<ReturnType<typeof useQuery>> = {},
): ReturnType<typeof useQuery> {
  return {
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
    ...overrides,
  } as ReturnType<typeof useQuery>;
}

describe("useReadingRanking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseReadingYears.mockReturnValue({
      data: [2025],
      isLoading: false,
    } as ReturnType<typeof useReadingYears>);
    mockUseQuery.mockReturnValue(baseQueryResult());
  });

  it("starts with books metric and empty ranked when there is no data", () => {
    const { result } = renderHook(() => useReadingRanking());

    expect(result.current.metric).toBe("books");
    expect(result.current.selectedYear).toBeUndefined();
    expect(result.current.ranked).toEqual([]);
  });

  it("sorts by books read descending when metric is books", () => {
    mockUseQuery.mockReturnValue(
      baseQueryResult({
        data: [
          row({ readerId: "a", booksRead: 1, totalPages: 500 }),
          row({ readerId: "b", booksRead: 5, totalPages: 10 }),
        ],
      }),
    );

    const { result } = renderHook(() => useReadingRanking());

    expect(result.current.ranked.map((r) => r.readerId)).toEqual(["b", "a"]);
    expect(result.current.ranked[0].rank).toBe(1);
  });

  it("sorts by pages when metric is pages", () => {
    mockUseQuery.mockReturnValue(
      baseQueryResult({
        data: [
          row({ readerId: "a", booksRead: 10, totalPages: 100 }),
          row({ readerId: "b", booksRead: 2, totalPages: 300 }),
        ],
      }),
    );

    const { result } = renderHook(() => useReadingRanking());

    act(() => {
      result.current.handleSetMetric("pages");
    });

    expect(result.current.ranked.map((r) => r.readerId)).toEqual(["b", "a"]);
  });

  it("updates selected year via handleSelectYear", () => {
    const { result } = renderHook(() => useReadingRanking());

    act(() => {
      result.current.handleSelectYear(2024);
    });

    expect(result.current.selectedYear).toBe(2024);
  });

  it("is loading when years query is loading", () => {
    mockUseReadingYears.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useReadingYears>);
    mockUseQuery.mockReturnValue(
      baseQueryResult({
        data: [],
        isLoading: false,
      }),
    );

    const { result } = renderHook(() => useReadingRanking());

    expect(result.current.isLoading).toBe(true);
  });

  it("redirects to auth and toasts when error is unauthorized", async () => {
    mockUseQuery.mockReturnValue(
      baseQueryResult({
        isError: true,
        error: new ApiError("Unauthorized", 401),
      }),
    );

    renderHook(() => useReadingRanking());

    await waitFor(() => {
      expect(toast).toHaveBeenCalled();
      expect(routerPushMock).toHaveBeenCalledWith("/auth");
    });
  });
});
