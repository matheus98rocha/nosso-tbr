import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useMultiSelect } from "./useMultiSelect";

const options = [
  { label: "A", value: "a" },
  { label: "B", value: "b" },
];

describe("useMultiSelect", () => {
  it("toggles a value in the selection", () => {
    const onChange = vi.fn();

    const { result, rerender } = renderHook(
      (props: { selected: string[] }) =>
        useMultiSelect({
          options,
          selected: props.selected,
          onChange,
        }),
      { initialProps: { selected: [] as string[] } },
    );

    act(() => {
      result.current.toggleValue("a");
    });

    expect(onChange).toHaveBeenCalledWith(["a"]);

    rerender({ selected: ["a"] });

    act(() => {
      result.current.toggleValue("a");
    });

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("derives selected labels from options", () => {
    const { result } = renderHook(() =>
      useMultiSelect({
        options,
        selected: ["a"],
        onChange: vi.fn(),
      }),
    );

    expect(result.current.selectedLabels).toEqual(["A"]);
  });
});
