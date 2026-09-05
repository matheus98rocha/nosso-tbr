import { act, renderHook } from "@testing-library/react";
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

  it("exibe limpar quando há valor e o campo não é obrigatório", () => {
    const { result } = renderHook(() =>
      useDatePicker({ value: new Date("2024-06-01") }),
    );

    expect(result.current.showClear).toBe(true);
  });

  it("não exibe limpar quando isRequiredField", () => {
    const { result } = renderHook(() =>
      useDatePicker({
        value: new Date("2024-06-01"),
        isRequiredField: true,
      }),
    );

    expect(result.current.showClear).toBe(false);
  });

  it("não exibe limpar quando allowClear é false", () => {
    const { result } = renderHook(() =>
      useDatePicker({
        value: new Date("2024-06-01"),
        allowClear: false,
      }),
    );

    expect(result.current.showClear).toBe(false);
  });

  it("handleClear chama onChange com undefined e fecha", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useDatePicker({
        value: new Date("2024-06-01"),
        onChange,
      }),
    );

    act(() => {
      result.current.setOpen(true);
      result.current.handleClear();
    });

    expect(onChange).toHaveBeenCalledWith(undefined);
    expect(result.current.open).toBe(false);
  });
});
