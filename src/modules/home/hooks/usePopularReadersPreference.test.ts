import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import usePopularReadersPreference from "./usePopularReadersPreference";

vi.mock("@/modules/profile/hooks/useClientMounted", () => ({
  useClientMounted: () => true,
}));

describe("usePopularReadersPreference", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("hides and shows with persistence for the same user", () => {
    const { result } = renderHook(() =>
      usePopularReadersPreference("user-1"),
    );

    expect(result.current.hidden).toBe(false);

    act(() => {
      result.current.hide();
    });

    expect(result.current.hidden).toBe(true);
    expect(
      window.localStorage.getItem(
        "nosso-tbr:home:hide-popular-readers:user-1",
      ),
    ).toBe("1");

    act(() => {
      result.current.show();
    });

    expect(result.current.hidden).toBe(false);
    expect(
      window.localStorage.getItem(
        "nosso-tbr:home:hide-popular-readers:user-1",
      ),
    ).toBeNull();
  });

  it("does not share hidden state across users", () => {
    const first = renderHook(() => usePopularReadersPreference("user-a"));
    act(() => {
      first.result.current.hide();
    });
    first.unmount();

    const second = renderHook(() => usePopularReadersPreference("user-b"));
    expect(second.result.current.hidden).toBe(false);
  });
});
