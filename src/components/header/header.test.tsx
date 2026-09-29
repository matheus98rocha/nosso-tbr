import { createElement, type ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockUseIsLoggedIn, mockUseHeader, mockHomeSearchBarMode } = vi.hoisted(
  () => ({
    mockUseIsLoggedIn: vi.fn(() => false),
    mockUseHeader: vi.fn(),
    mockHomeSearchBarMode: { current: "ready" as "ready" | "suspend" },
  }),
);

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    prefetchQuery: vi.fn(),
  }),
}));

vi.mock("@/stores/hooks/useAuth", () => ({
  useIsLoggedIn: mockUseIsLoggedIn,
}));

vi.mock("@/stores/userStore", () => ({
  useUserStore: vi.fn(
    (selector: (state: { user: null; loading: boolean }) => unknown) =>
      selector({ user: null, loading: false }),
  ),
}));

vi.mock("./hooks/useHeader", () => ({
  useHeader: mockUseHeader,
}));

vi.mock("./hooks/useHeaderAccount", () => ({
  useHeaderAccount: () => ({
    account: null,
    isLoading: false,
    isLoggedIn: false,
    navigateToProfile: vi.fn(),
    navigateToAuth: vi.fn(),
    handleLogout: vi.fn(),
  }),
}));

vi.mock("./components/homeSearchBar", () => ({
  HomeSearchBar: () => {
    if (mockHomeSearchBarMode.current === "suspend") {
      throw new Promise(() => undefined);
    }

    return createElement("div", { "data-testid": "home-search-bar" }, "busca");
  },
}));

vi.mock("./components/navMenu", () => ({
  DesktopNavMenu: () =>
    createElement("nav", { "data-testid": "desktop-nav" }, "nav"),
}));

vi.mock("./components/headerAccountMenu", () => ({
  default: () =>
    createElement("div", { "data-testid": "account-menu" }, "conta"),
}));

vi.mock("./components/headerAccountSummary", () => ({
  default: () => null,
}));

vi.mock("./components/bottomNav", () => ({
  BottomNav: () =>
    createElement("nav", { "data-testid": "bottom-nav-mock" }, "bottom"),
  default: () =>
    createElement("nav", { "data-testid": "bottom-nav-mock" }, "bottom"),
}));

vi.mock("./components/moreSheet", () => ({
  MoreSheet: () =>
    createElement("div", { "data-testid": "more-sheet-mock" }, "more"),
  default: () =>
    createElement("div", { "data-testid": "more-sheet-mock" }, "more"),
}));

vi.mock("@/modules/shelves/components/createEditBookshelves", () => ({
  CreateEditBookshelves: () => null,
}));

vi.mock("@/assets/icons/logo", () => ({
  default: () => createElement("span", null, "logo"),
}));

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  SheetTrigger: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  SheetContent: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  SheetHeader: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  SheetTitle: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  SheetFooter: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  SheetClose: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
}));

import { HOME_SEARCH_FALLBACK_CLASS } from "./constants";
import Header from "./header";

function desktopNavSlot() {
  return screen.getByTestId("app-header-desktop-nav");
}

function classTokens(className: string) {
  return className.split(/\s+/).filter(Boolean);
}

function mockHeader(pathname = "/") {
  mockUseHeader.mockReturnValue({
    createShelfDialog: { isOpen: false, setIsOpen: vi.fn() },
    menuItems: [],
    desktopNavItems: [],
    mobilePrimaryItems: [],
    mobileOverflowItems: [],
    pathname,
    router: { push: vi.fn() },
  });
}

describe("Header — composição", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHomeSearchBarMode.current = "ready";
    mockUseIsLoggedIn.mockReturnValue(false);
    mockHeader();
  });

  describe("visitante", () => {
    it("renderiza busca na home e menu da conta", () => {
      render(<Header />);

      expect(
        screen.getAllByRole("button", { name: "Ir para a página inicial" }),
      ).toHaveLength(1);
      expect(screen.getAllByTestId("account-menu")).toHaveLength(1);
      expect(screen.getAllByTestId("home-search-bar")).toHaveLength(1);
    });

    it("não renderiza bottom nav nem links da nav desktop", () => {
      render(<Header />);

      expect(screen.queryByTestId("app-header-bottom-nav")).toBeNull();
      expect(
        within(desktopNavSlot()).getByTestId("desktop-nav"),
      ).toBeInTheDocument();
    });
  });

  describe("autenticado", () => {
    beforeEach(() => {
      mockUseIsLoggedIn.mockReturnValue(true);
    });

    it("reserva o slot desktop com max-lg:hidden e lg:flex, sem flex solto", () => {
      render(<Header />);

      const navClasses = classTokens(desktopNavSlot().className);

      expect(navClasses).toContain("max-lg:hidden");
      expect(navClasses).toContain("lg:flex");
      expect(navClasses).not.toContain("flex");
      expect(navClasses).not.toContain("hidden");
      expect(navClasses).not.toContain("md:flex");
      expect(
        within(desktopNavSlot()).getByTestId("desktop-nav"),
      ).toBeInTheDocument();
    });

    it("reserva a bottom nav abaixo de lg via wrapper app-header-bottom-nav", () => {
      render(<Header />);

      const bottomNav = screen.getByTestId("app-header-bottom-nav");
      const classes = classTokens(bottomNav.className);

      expect(classes).toContain("lg:hidden");
      expect(classes).not.toContain("hidden");
      expect(classes).not.toContain("md:hidden");
    });
  });

  describe("busca da home", () => {
    it("mantém busca da home mesmo sem sessão", () => {
      render(<Header />);

      expect(screen.getByTestId("home-search-bar")).toBeInTheDocument();
    });

    it("mantém busca da home também com sessão", () => {
      mockUseIsLoggedIn.mockReturnValue(true);

      render(<Header />);

      expect(screen.getByTestId("home-search-bar")).toBeInTheDocument();
    });

    it("não renderiza busca fora da home", () => {
      mockHeader("/stats");

      render(<Header />);

      expect(screen.queryByTestId("home-search-bar")).toBeNull();
    });

    it("mantém o chrome quando a busca da home suspende", () => {
      mockHomeSearchBarMode.current = "suspend";

      render(<Header />);

      expect(
        screen.getByRole("button", { name: "Ir para a página inicial" }),
      ).toBeInTheDocument();
      expect(screen.getByTestId("account-menu")).toBeInTheDocument();
      expect(desktopNavSlot()).toBeInTheDocument();
      expect(screen.queryByTestId("home-search-bar")).toBeNull();
      expect(
        [...screen.getByTestId("app-header").querySelectorAll("[aria-hidden]")].some(
          (node) => node.className === HOME_SEARCH_FALLBACK_CLASS,
        ),
      ).toBe(true);
    });
  });
});
