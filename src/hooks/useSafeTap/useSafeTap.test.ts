import type { TouchEvent as ReactTouchEvent } from "react";
import { act, renderHook } from "@testing-library/react";
import { vi } from "vitest";
import useSafeTap from "./useSafeTap";

function touchStart(clientY: number): ReactTouchEvent {
  const touch = { clientY } as Touch;
  return {
    touches: [touch],
  } as unknown as ReactTouchEvent;
}

function touchEnd(clientY: number): ReactTouchEvent {
  const touch = { clientY } as Touch;
  return {
    changedTouches: [touch],
  } as unknown as ReactTouchEvent;
}

describe("useSafeTap", () => {
  it("calls onSafeTap when handleClick is invoked", () => {
    const onSafeTap = vi.fn();
    const { result } = renderHook(() => useSafeTap(onSafeTap));

    act(() => result.current.handleClick());

    expect(onSafeTap).toHaveBeenCalledTimes(1);
  });

  it("does not call onSafeTap on touch end when touch start was never recorded", () => {
    const onSafeTap = vi.fn();
    const { result } = renderHook(() => useSafeTap(onSafeTap));

    act(() => result.current.handleTouchEnd(touchEnd(100)));

    expect(onSafeTap).not.toHaveBeenCalled();
  });

  it("calls onSafeTap when vertical movement between start and end is under 10px", () => {
    const onSafeTap = vi.fn();
    const { result } = renderHook(() => useSafeTap(onSafeTap));

    act(() => {
      result.current.handleTouchStart(touchStart(100));
      result.current.handleTouchEnd(touchEnd(108));
    });

    expect(onSafeTap).toHaveBeenCalledTimes(1);
  });

  it("does not call onSafeTap when vertical movement is exactly 10px", () => {
    const onSafeTap = vi.fn();
    const { result } = renderHook(() => useSafeTap(onSafeTap));

    act(() => {
      result.current.handleTouchStart(touchStart(100));
      result.current.handleTouchEnd(touchEnd(110));
    });

    expect(onSafeTap).not.toHaveBeenCalled();
  });

  it("does not call onSafeTap when vertical movement exceeds 10px", () => {
    const onSafeTap = vi.fn();
    const { result } = renderHook(() => useSafeTap(onSafeTap));

    act(() => {
      result.current.handleTouchStart(touchStart(50));
      result.current.handleTouchEnd(touchEnd(70));
    });

    expect(onSafeTap).not.toHaveBeenCalled();
  });

  it("treats upward swipe the same as downward for the distance threshold", () => {
    const onSafeTap = vi.fn();
    const { result } = renderHook(() => useSafeTap(onSafeTap));

    act(() => {
      result.current.handleTouchStart(touchStart(100));
      result.current.handleTouchEnd(touchEnd(92));
    });

    expect(onSafeTap).toHaveBeenCalledTimes(1);
  });

  it("clears touch state after touch end so a lone touch end does not fire onSafeTap", () => {
    const onSafeTap = vi.fn();
    const { result } = renderHook(() => useSafeTap(onSafeTap));

    act(() => {
      result.current.handleTouchStart(touchStart(100));
      result.current.handleTouchEnd(touchEnd(100));
    });
    expect(onSafeTap).toHaveBeenCalledTimes(1);

    act(() => result.current.handleTouchEnd(touchEnd(100)));

    expect(onSafeTap).toHaveBeenCalledTimes(1);
  });
});
