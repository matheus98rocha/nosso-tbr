import type { ReactNode } from "react";
import {
  createEvent,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SHELVES_LIST_PATH } from "@/lib/routes/shelves";

const { mockUseHeader, mockHandlePrefetch } = vi.hoisted(() => ({
  mockUseHeader: vi.fn(),
  mockHandlePrefetch: vi.fn(),
}));

vi.mock("../../hooks/useHeader", () => ({
  useHeader: mockUseHeader,
}));

vi.mock("../../hooks/useDesktopNav", () => ({
  useDesktopNav: () => ({
    handlePrefetch: mockHandlePrefetch,
  }),
}));

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

import { DesktopNavMenu } from "./navMenu";

const ALLOWED_LABELS = [
  "Início",
  "Estatisticas",
  "Ver Estantes",
  "Autores",
] as const;

function buildMenuItems() {
  return [
    {
      label: "Início",
      items: [
        {
          label: "Início",
          path: "/",
          action: vi.fn(),
        },
      ],
    },
    {
      label: "Livros",
      items: [
        {
          label: "Importar CSV",
          action: vi.fn(),
        },
      ],
    },
    {
      label: "Estatisticas",
      items: [
        {
          label: "Estatisticas",
          path: "/stats",
          action: vi.fn(),
        },
      ],
    },
    {
      label: "Estantes",
      items: [
        {
          label: "Ver Estantes",
          path: SHELVES_LIST_PATH,
          action: vi.fn(),
        },
        {
          label: "Adicionar Estante",
          action: vi.fn(),
        },
      ],
    },
    {
      label: "Autores",
      items: [
        {
          label: "Autores",
          path: "/authors",
          action: vi.fn(),
        },
      ],
    },
    {
      label: "Conta",
      items: [
        {
          label: "Perfil",
          path: "/profile",
          action: vi.fn(),
        },
      ],
    },
  ];
}

function renderDesktopNavMenu(
  overrides: {
    pathname?: string;
    isLoading?: boolean;
  } = {},
) {
  mockUseHeader.mockReturnValue({
    menuItems: buildMenuItems(),
    pathname: overrides.pathname ?? "/",
  });

  render(<DesktopNavMenu isLoading={overrides.isLoading ?? false} />);
}

describe("DesktopNavMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("estrutura semântica nav > ul > li", () => {
    it("renderiza nav com ul e um li por item filtrado", () => {
      renderDesktopNavMenu();

      const nav = screen.getByRole("navigation");
      const list = within(nav).getByRole("list");
      const items = within(list).getAllByRole("listitem");

      expect(items).toHaveLength(ALLOWED_LABELS.length);
    });

    it("inclui classe desktop-nav no nav para efeito CSS anchor", () => {
      renderDesktopNavMenu();

      const nav = screen.getByRole("navigation");
      expect(nav.className).toMatch(/desktop-nav/);
      expect(nav).toHaveAttribute("aria-label", "Navegação principal");
    });
  });

  describe("filtro ALLOWED_LABELS", () => {
    it("exibe somente Início, Estatisticas, Ver Estantes e Autores", () => {
      renderDesktopNavMenu();

      for (const label of ALLOWED_LABELS) {
        expect(screen.getByText(label)).toBeInTheDocument();
      }

      expect(screen.queryByText("Adicionar Livro")).not.toBeInTheDocument();
      expect(screen.queryByText("Importar CSV")).not.toBeInTheDocument();
      expect(screen.queryByText("Adicionar Estante")).not.toBeInTheDocument();
      expect(screen.queryByText("Perfil")).not.toBeInTheDocument();
    });
  });

  describe("itens de link", () => {
    it("renderiza link Início com href /", () => {
      renderDesktopNavMenu();

      expect(screen.getByRole("link", { name: /Início/i })).toHaveAttribute(
        "href",
        "/",
      );
    });

    it("renderiza links Next.js dentro de li com href correto", () => {
      renderDesktopNavMenu();

      expect(screen.getByRole("link", { name: /Início/i })).toHaveAttribute(
        "href",
        "/",
      );
      expect(screen.getByRole("link", { name: /Estatisticas/i })).toHaveAttribute(
        "href",
        "/stats",
      );
      expect(
        screen.getByRole("link", { name: /Ver Estantes/i }),
      ).toHaveAttribute("href", SHELVES_LIST_PATH);
      expect(screen.getByRole("link", { name: /Autores/i })).toHaveAttribute(
        "href",
        "/authors",
      );
    });

    it("marca item ativo com aria-current=page", () => {
      renderDesktopNavMenu({ pathname: "/stats" });

      expect(screen.getByRole("link", { name: /Estatisticas/i })).toHaveAttribute(
        "aria-current",
        "page",
      );
      expect(
        screen.getByRole("link", { name: /Ver Estantes/i }),
      ).not.toHaveAttribute("aria-current");
    });

    it("marca Início como ativo na rota raiz", () => {
      renderDesktopNavMenu({ pathname: "/" });

      expect(screen.getByRole("link", { name: /Início/i })).toHaveAttribute(
        "aria-current",
        "page",
      );
    });

    it("impede navegação ao clicar no link do item ativo", () => {
      renderDesktopNavMenu({ pathname: "/stats" });

      const activeLink = screen.getByRole("link", { name: /Estatisticas/i });
      const clickEvent = createEvent.click(activeLink);

      fireEvent(activeLink, clickEvent);

      expect(clickEvent.defaultPrevented).toBe(true);
    });

    it("chama handlePrefetch no mouseEnter do link", () => {
      renderDesktopNavMenu();

      fireEvent.mouseEnter(screen.getByRole("link", { name: /Autores/i }));

      expect(mockHandlePrefetch).toHaveBeenCalledWith("Autores");
    });
  });

  describe("estado de carregamento", () => {
    it("renderiza NavSkeleton com nav semântico quando isLoading é true", () => {
      renderDesktopNavMenu({ isLoading: true });

      const nav = screen.getByRole("navigation", { hidden: true });
      expect(nav).toHaveAttribute("aria-hidden", "true");
      expect(within(nav).getByRole("list", { hidden: true })).toBeInTheDocument();
      expect(within(nav).getAllByRole("listitem", { hidden: true })).toHaveLength(
        4,
      );
    });
  });
});
