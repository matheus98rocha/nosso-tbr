import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useReadingYears } from "@/hooks/useReadingYears";
import { useYearFilterChips } from "./useYearFilterChips";

vi.mock("@/hooks/useReadingYears", () => ({
  useReadingYears: vi.fn(),
}));

const mockUseReadingYears = vi.mocked(useReadingYears);

describe("useYearFilterChips", () => {
  const onSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseReadingYears.mockReturnValue({
      data: [2026, 2025, 2024],
      isLoading: false,
    } as ReturnType<typeof useReadingYears>);
  });

  it("combines parent isLoading with years query loading", () => {
    mockUseReadingYears.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useReadingYears>);

    const { result } = renderHook(() =>
      useYearFilterChips({
        activeYear: undefined,
        onSelect,
        isLoading: false,
      }),
    );

    expect(result.current.isLoading).toBe(true);
  });

  it("isLoading is true when isLoading prop is true even if query finished", () => {
    mockUseReadingYears.mockReturnValue({
      data: [2026],
      isLoading: false,
    } as ReturnType<typeof useReadingYears>);

    const { result } = renderHook(() =>
      useYearFilterChips({
        activeYear: undefined,
        onSelect,
        isLoading: true,
      }),
    );

    expect(result.current.isLoading).toBe(true);
  });

  it("exposes yearsList from query data or empty array", () => {
    const { result } = renderHook(() =>
      useYearFilterChips({
        activeYear: undefined,
        onSelect,
        isLoading: false,
      }),
    );

    expect(result.current.yearsList).toEqual([2026, 2025, 2024]);
  });

  it("handleSelect calls onSelect with year when different from activeYear", () => {
    const { result } = renderHook(() =>
      useYearFilterChips({
        activeYear: undefined,
        onSelect,
        isLoading: false,
      }),
    );

    act(() => {
      result.current.handleSelect(2025);
    });

    expect(onSelect).toHaveBeenCalledWith(2025);
  });

  it("handleSelect calls onSelect with undefined when toggling active year", () => {
    const { result } = renderHook(() =>
      useYearFilterChips({
        activeYear: 2026,
        onSelect,
        isLoading: false,
      }),
    );

    act(() => {
      result.current.handleSelect(2026);
    });

    expect(onSelect).toHaveBeenCalledWith(undefined);
  });
});
