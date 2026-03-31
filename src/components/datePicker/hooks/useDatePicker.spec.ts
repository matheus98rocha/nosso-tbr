import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDatePicker } from "./useDatePicker";

describe("useDatePicker", () => {
  it("starts with popover closed", () => {
    const { result } = renderHook(() => useDatePicker({}));

    expect(result.current.open).toBe(false);
  });

  it("calls onChange and closes when a date is selected", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useDatePicker({ onChange, isAfterTodayHidden: false }),
    );

    act(() => {
      result.current.setOpen(true);
    });

    expect(result.current.open).toBe(true);

    const date = new Date("2024-06-01");
    act(() => {
      result.current.handleSelect(date);
    });

    expect(onChange).toHaveBeenCalledWith(date);
    expect(result.current.open).toBe(false);
  });
});
