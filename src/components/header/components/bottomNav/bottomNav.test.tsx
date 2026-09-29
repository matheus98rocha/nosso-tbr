import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
    onClick,
    onMouseEnter,
    "aria-current": ariaCurrent,
    "aria-label": ariaLabel,
  }: {
    children: ReactNode;
    href: string;
    className?: string;
    onClick?: (event: { preventDefault: () => void }) => void;
    onMouseEnter?: () => void;
    "aria-current"?: "page";
    "aria-label"?: string;
  }) => (
    <a
      href={href}
      className={className}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      aria-current={ariaCurrent}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  ),
}));

const mockHandlePrefetch = vi.fn();

vi.mock("../../hooks/useBottomNav", () => ({
  useBottomNav: () => ({
    isActive: (path?: string) => path === "/",
    handlePrefetch: mockHandlePrefetch,
    visibleLabel: (label: string) =>
      label === "Ver Estantes" ? "Estantes" : label,
  }),
}));

vi.mock("../moreSheet", () => ({
  default: ({ items }: { items: { label: string }[] }) => (
    <div data-testid="more-sheet">
      {items.map((item) => item.label).join(",")}
    </div>
  ),
}));

import BottomNav from "./bottomNav";

describe("BottomNav", () => {
  it("renderiza destinos primários e o overflow Mais", () => {
    render(
      <BottomNav
        pathname="/"
        overflowItems={[{ label: "Adicionar Estante", action: vi.fn() }]}
        items={[
          { label: "Início", path: "/", action: vi.fn() },
          { label: "Ver Estantes", path: "/shelves", action: vi.fn() },
        ]}
      />,
    );

    expect(screen.getByRole("navigation", { name: "Navegação principal" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Início" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Ver Estantes" })).toHaveAttribute(
      "href",
      "/shelves",
    );
    expect(screen.getByText("Estantes")).toBeInTheDocument();
    expect(screen.getByTestId("more-sheet")).toHaveTextContent("Adicionar Estante");
  });

  it("marca o destino ativo e dispara prefetch no hover", () => {
    render(
      <BottomNav
        pathname="/"
        overflowItems={[]}
        items={[{ label: "Início", path: "/", action: vi.fn() }]}
      />,
    );

    const home = screen.getByRole("link", { name: "Início" });

    expect(home).toHaveAttribute("aria-current", "page");
    fireEvent.mouseEnter(home);
    expect(mockHandlePrefetch).toHaveBeenCalledWith("Início");
  });
});
