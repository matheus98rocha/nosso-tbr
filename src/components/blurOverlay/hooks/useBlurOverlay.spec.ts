import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

import { useBlurOverlay } from "./useBlurOverlay";

describe("useBlurOverlay", () => {
  it("navigates to /auth when goToAuth is called", () => {
    const { result } = renderHook(() => useBlurOverlay());

    result.current.goToAuth();

    expect(push).toHaveBeenCalledWith("/auth");
  });
});
