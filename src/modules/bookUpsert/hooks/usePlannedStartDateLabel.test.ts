import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  plannedStartDateLabels,
  usePlannedStartDateLabel,
} from "./usePlannedStartDateLabel";

describe("usePlannedStartDateLabel", () => {
  it("returns default label for non-paused and non-abandoned statuses", () => {
    const { result } = renderHook(() => usePlannedStartDateLabel("planned"));

    expect(result.current.plannedStartDateLabel).toBe(
      plannedStartDateLabels.default,
    );
  });

  it("returns paused creative label when status is paused", () => {
    const { result } = renderHook(() => usePlannedStartDateLabel("paused"));

    expect(result.current.plannedStartDateLabel).toBe(
      plannedStartDateLabels.paused,
    );
  });

  it("returns abandoned creative label when status is abandoned", () => {
    const { result } = renderHook(() => usePlannedStartDateLabel("abandoned"));

    expect(result.current.plannedStartDateLabel).toBe(
      plannedStartDateLabels.abandoned,
    );
  });

  it("returns default label when status is null", () => {
    const { result } = renderHook(() => usePlannedStartDateLabel(null));

    expect(result.current.plannedStartDateLabel).toBe(
      plannedStartDateLabels.default,
    );
  });
});
