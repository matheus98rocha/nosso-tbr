import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import useReadingYears from "./useReadingYears";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

const mockUseQuery = vi.mocked(useQuery);
const mockCreateClient = vi.mocked(createClient);

function expectYearsDescending(years: number[]) {
  const sorted = [...years].sort((a, b) => b - a);
  expect(years).toEqual(sorted);
}

function setupSupabaseSelect(result: {
  data: { year: number }[] | null;
  error: Error | null;
}) {
  const select = vi.fn().mockResolvedValue(result);
  const from = vi.fn(() => ({ select }));
  mockCreateClient.mockReturnValue({ from } as unknown as ReturnType<
    typeof createClient
  >);
  return { from, select };
}

function captureQueryFn() {
  let queryFn: (() => Promise<number[]>) | undefined;
  mockUseQuery.mockImplementation((options) => {
    if (typeof options.queryFn !== "function") {
      throw new Error("useReadingYears must pass queryFn");
    }
    queryFn = options.queryFn as () => Promise<number[]>;
    return {
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useQuery>;
  });
  return {
    getQueryFn: () => {
      if (!queryFn) {
        throw new Error("queryFn was not captured");
      }
      return queryFn;
    },
  };
}

describe("useReadingYears", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useQuery>);
  });

  it("registers a query with key readingYears", () => {
    setupSupabaseSelect({ data: [], error: null });

    renderHook(() => useReadingYears());

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["readingYears"],
      }),
    );
  });

  it("queryFn requests distinct_reading_years, maps rows to years, and sorts descending (e.g. 2026→2023)", async () => {
    const { select } = setupSupabaseSelect({
      data: [{ year: 2023 }, { year: 2026 }, { year: 2024 }, { year: 2025 }],
      error: null,
    });

    const { getQueryFn } = captureQueryFn();

    renderHook(() => useReadingYears());

    const years = await getQueryFn()();

    expect(mockCreateClient).toHaveBeenCalled();
    expect(mockCreateClient().from).toHaveBeenCalledWith(
      "distinct_reading_years",
    );
    expect(select).toHaveBeenCalledWith("year");
    expect(years).toEqual([2026, 2025, 2024, 2023]);
    expectYearsDescending(years);
  });

  it("queryFn sorts descending when years include future and past values", async () => {
    setupSupabaseSelect({
      data: [{ year: 2010 }, { year: 2030 }, { year: 2028 }],
      error: null,
    });

    const { getQueryFn } = captureQueryFn();

    renderHook(() => useReadingYears());

    const years = await getQueryFn()();
    expect(years).toEqual([2030, 2028, 2010]);
    expectYearsDescending(years);
  });

  it("queryFn returns an empty array when there are no rows", async () => {
    setupSupabaseSelect({ data: [], error: null });

    const { getQueryFn } = captureQueryFn();

    renderHook(() => useReadingYears());

    const years = await getQueryFn()();
    expect(years).toEqual([]);
    expectYearsDescending(years);
  });

  it("queryFn rejects when Supabase returns an error", async () => {
    const dbError = new Error("permission denied");
    setupSupabaseSelect({ data: null, error: dbError });

    const { getQueryFn } = captureQueryFn();

    renderHook(() => useReadingYears());

    await expect(getQueryFn()()).rejects.toThrow("permission denied");
  });

  it("exports the same function as default and named useReadingYears", async () => {
    const mod = await import("./useReadingYears");
    expect(mod.default).toBe(mod.useReadingYears);
  });
});
