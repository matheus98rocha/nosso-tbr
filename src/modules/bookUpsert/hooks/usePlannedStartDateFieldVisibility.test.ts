import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePlannedStartDateFieldVisibility } from "./usePlannedStartDateFieldVisibility";

describe("usePlannedStartDateFieldVisibility", () => {
  it("shows field for not_started status", () => {
    const { result } = renderHook(() =>
      usePlannedStartDateFieldVisibility({
        selectedStatus: "not_started",
      }),
    );

    expect(result.current.shouldShowPlannedStartDate).toBe(true);
  });

  it("shows field for planned status", () => {
    const { result } = renderHook(() =>
      usePlannedStartDateFieldVisibility({
        selectedStatus: "planned",
      }),
    );

    expect(result.current.shouldShowPlannedStartDate).toBe(true);
  });

  it("shows field when status is null", () => {
    const { result } = renderHook(() =>
      usePlannedStartDateFieldVisibility({
        selectedStatus: null,
      }),
    );

    expect(result.current.shouldShowPlannedStartDate).toBe(true);
  });

  it("hides field for paused status", () => {
    const { result } = renderHook(() =>
      usePlannedStartDateFieldVisibility({
        selectedStatus: "paused",
      }),
    );

    expect(result.current.shouldShowPlannedStartDate).toBe(false);
  });

  it("hides field for abandoned status", () => {
    const { result } = renderHook(() =>
      usePlannedStartDateFieldVisibility({
        selectedStatus: "abandoned",
      }),
    );

    expect(result.current.shouldShowPlannedStartDate).toBe(false);
  });

  it("hides field for finished status", () => {
    const { result } = renderHook(() =>
      usePlannedStartDateFieldVisibility({
        selectedStatus: "finished",
      }),
    );

    expect(result.current.shouldShowPlannedStartDate).toBe(false);
  });
});
