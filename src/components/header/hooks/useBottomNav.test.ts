import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./useDesktopNav", () => ({
  useDesktopNav: () => ({
    handlePrefetch: vi.fn(),
  }),
}));

import { useBottomNav } from "./useBottomNav";

describe("useBottomNav", () => {
  it("considera ativo o path atual", () => {
    const { result } = renderHook(() => useBottomNav("/shelves"));

    expect(result.current.isActive("/shelves")).toBe(true);
    expect(result.current.isActive("/")).toBe(false);
    expect(result.current.isActive(undefined)).toBe(false);
  });

  it("usa rótulo curto de Ver Estantes na barra", () => {
    const { result } = renderHook(() => useBottomNav("/"));

    expect(result.current.visibleLabel("Ver Estantes")).toBe("Estantes");
    expect(result.current.visibleLabel("Início")).toBe("Início");
  });
});
