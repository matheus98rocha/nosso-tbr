import type { ReactNode } from "react";
import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { NavItemData } from "../../types/desktopNavMenu.types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    onMouseEnter,
    onClick,
    className,
    "aria-current": ariaCurrent,
  }: {
    children: ReactNode;
    href: string;
    onMouseEnter?: () => void;
    onClick?: (event: { preventDefault: () => void }) => void;
    className?: string;
    "aria-current"?: "page";
  }) => (
    <a
      href={href}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={className}
      aria-current={ariaCurrent}
    >
      {children}
    </a>
  ),
}));

import { NavItem } from "./navItem";

function renderNavItem(
  item: NavItemData,
  options: {
    isActive?: boolean;
    onPrefetch?: (label: string) => Promise<void>;
  } = {},
) {
  const onPrefetch =
    options.onPrefetch ?? vi.fn<(label: string) => Promise<void>>();

  render(
    <NavItem
      item={item}
      isActive={options.isActive ?? false}
      onPrefetch={onPrefetch}
    />,
  );

  return { onPrefetch };
}

describe("NavItem", () => {
  describe("estrutura semântica e classes CSS anchor", () => {
    it("envolve link Início em li com desktop-nav__link", () => {
      const { container } = render(
        <NavItem
          item={{ label: "Início", path: "/" }}
          isActive={false}
          onPrefetch={vi.fn()}
        />,
      );

      const listItem = container.querySelector("li");
      const link = screen.getByRole("link", { name: /Início/i });

      expect(listItem).toContainElement(link);
      expect(link.className).toMatch(/desktop-nav__link/);
    });

    it("envolve link em li com desktop-nav__link", () => {
      const { container } = render(
        <NavItem
          item={{ label: "Autores", path: "/authors" }}
          isActive={false}
          onPrefetch={vi.fn()}
        />,
      );

      const listItem = container.querySelector("li");
      const link = screen.getByRole("link", { name: /Autores/i });

      expect(listItem).toContainElement(link);
      expect(link.className).toMatch(/desktop-nav__link/);
    });
  });

  describe("Início", () => {
    it("renderiza link com href / e label Início", () => {
      renderNavItem({ label: "Início", path: "/" });

      expect(screen.getByRole("link", { name: /Início/i })).toHaveAttribute(
        "href",
        "/",
      );
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("aplica aria-current=page quando isActive é true", () => {
      renderNavItem({ label: "Início", path: "/" }, { isActive: true });

      expect(screen.getByRole("link", { name: /Início/i })).toHaveAttribute(
        "aria-current",
        "page",
      );
    });
  });

  describe("itens de navegação por link", () => {
    it("renderiza Link com href do item", () => {
      renderNavItem({ label: "Ver Estantes", path: "/shelves" });

      expect(screen.getByRole("link", { name: /Ver Estantes/i })).toHaveAttribute(
        "href",
        "/shelves",
      );
    });

    it("aplica aria-current=page quando isActive é true", () => {
      renderNavItem(
        { label: "Estatisticas", path: "/stats" },
        { isActive: true },
      );

      expect(screen.getByRole("link", { name: /Estatisticas/i })).toHaveAttribute(
        "aria-current",
        "page",
      );
    });

    it("impede navegação ao clicar no link ativo", () => {
      renderNavItem(
        { label: "Autores", path: "/authors" },
        { isActive: true },
      );

      const link = screen.getByRole("link", { name: /Autores/i });
      const clickEvent = createEvent.click(link);

      fireEvent(link, clickEvent);

      expect(clickEvent.defaultPrevented).toBe(true);
    });

    it("chama onPrefetch com label no mouseEnter", () => {
      const { onPrefetch } = renderNavItem({
        label: "Autores",
        path: "/authors",
      });

      fireEvent.mouseEnter(screen.getByRole("link", { name: /Autores/i }));

      expect(onPrefetch).toHaveBeenCalledWith("Autores");
    });
  });
});
