import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePlannedStartDateFieldVisibility } from "./usePlannedStartDateFieldVisibility";

describe("usePlannedStartDateFieldVisibility", () => {
  it("shows field when status is paused even if start_date exists", () => {
    const { result } = renderHook(() =>
      usePlannedStartDateFieldVisibility({
        selectedStatus: "paused",
        startDate: "2025-01-01",
        endDate: null,
      }),
    );

    expect(result.current.shouldShowPlannedStartDate).toBe(true);
  });

  it("shows field when status is abandoned", () => {
    const { result } = renderHook(() =>
      usePlannedStartDateFieldVisibility({
        selectedStatus: "abandoned",
        startDate: null,
        endDate: null,
      }),
    );

    expect(result.current.shouldShowPlannedStartDate).toBe(true);
  });

  it("shows field when book has no start and no end date", () => {
    const { result } = renderHook(() =>
      usePlannedStartDateFieldVisibility({
        selectedStatus: "planned",
        startDate: null,
        endDate: null,
      }),
    );

    expect(result.current.shouldShowPlannedStartDate).toBe(true);
  });

  it("hides field when book has started and status is reading", () => {
    const { result } = renderHook(() =>
      usePlannedStartDateFieldVisibility({
        selectedStatus: "reading",
        startDate: "2025-01-01",
        endDate: null,
      }),
    );

    expect(result.current.shouldShowPlannedStartDate).toBe(false);
  });
});
