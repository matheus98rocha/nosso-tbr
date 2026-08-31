import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import { nextNavigationTestState } from "@/test/nextNavigationTestState";

const { mockUseIsLoggedIn } = vi.hoisted(() => ({
  mockUseIsLoggedIn: vi.fn(() => true),
}));

vi.mock("@/stores/hooks/useAuth", () => ({
  useIsLoggedIn: mockUseIsLoggedIn,
}));

vi.mock("@/stores/userStore", () => ({
  useUserStore: vi.fn((selector: (state: { logout: () => void }) => unknown) =>
    selector({ logout: vi.fn() }),
  ),
}));

vi.mock("@/hooks/", () => ({
  useModal: vi.fn(() => ({
    isOpen: false,
    setIsOpen: vi.fn(),
  })),
}));

import { useHeader } from "./useHeader";

describe("useHeader — menu desktop", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseIsLoggedIn.mockReturnValue(true);
  });

  it("expõe item Início com path / no primeiro grupo do menu", () => {
    const { result } = renderHook(() => useHeader());

    const inicioGroup = result.current.menuItems.find(
      (menu) => menu.label === "Início",
    );

    expect(inicioGroup).toBeDefined();
    expect(inicioGroup?.items).toEqual([
      expect.objectContaining({
        label: "Início",
        path: "/",
      }),
    ]);
  });

  it("não expõe bookUpsertModal nem item Adicionar Livro", () => {
    const { result } = renderHook(() => useHeader());

    expect(result.current).not.toHaveProperty("bookUpsertModal");

    const allLabels = result.current.menuItems.flatMap((menu) =>
      menu.items.map((item) => item.label),
    );

    expect(allLabels).not.toContain("Adicionar Livro");
  });

  it("action de Início navega para /", () => {
    const { result } = renderHook(() => useHeader());

    const inicioItem = result.current.menuItems
      .find((menu) => menu.label === "Início")
      ?.items.find((item) => item.label === "Início");

    inicioItem?.action();

    expect(nextNavigationTestState.router.push).toHaveBeenCalledWith("/");
  });
});
