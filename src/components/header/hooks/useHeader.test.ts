import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import { nextNavigationTestState } from "@/test/nextNavigationTestState";

const { mockLogout, mockSetIsOpen, mockUseIsAdmin, mockUseIsLoggedIn } =
  vi.hoisted(() => ({
    mockLogout: vi.fn(),
    mockSetIsOpen: vi.fn(),
    mockUseIsAdmin: vi.fn(() => false),
    mockUseIsLoggedIn: vi.fn(() => true),
  }));

vi.mock("@/stores/hooks/useAuth", () => ({
  useIsLoggedIn: mockUseIsLoggedIn,
  useIsAdmin: mockUseIsAdmin,
}));

vi.mock("@/stores/userStore", () => ({
  useUserStore: vi.fn((selector: (state: { logout: () => void }) => unknown) =>
    selector({ logout: mockLogout }),
  ),
}));

vi.mock("@/hooks/", () => ({
  useModal: vi.fn(() => ({
    isOpen: false,
    setIsOpen: mockSetIsOpen,
  })),
}));

import { useHeader } from "./useHeader";

function itemLabels(items: { label: string }[] | undefined) {
  return (items ?? []).map((item) => item.label);
}

function headerSurfaces(header: object) {
  return header as {
    desktopNavItems?: { label: string }[];
    mobilePrimaryItems?: { label: string }[];
    mobileOverflowItems?: { label: string }[];
    mobileOverflowMenus?: { items: { label: string }[] }[];
  };
}

function overflowLabels(header: object) {
  const surfaces = headerSurfaces(header);

  if (surfaces.mobileOverflowItems) {
    return itemLabels(surfaces.mobileOverflowItems);
  }

  return (surfaces.mobileOverflowMenus ?? []).flatMap((menu) =>
    itemLabels(menu.items),
  );
}

describe("useHeader — menu desktop", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseIsLoggedIn.mockReturnValue(true);
    mockUseIsAdmin.mockReturnValue(false);
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

  it("expõe Comunidade para common-user autenticado", () => {
    const { result } = renderHook(() => useHeader());

    const allLabels = result.current.menuItems.flatMap((menu) =>
      menu.items.map((item) => item.label),
    );

    expect(allLabels).toContain("Comunidade");
  });

  it("oculta Comunidade quando o usuário não está autenticado", () => {
    mockUseIsLoggedIn.mockReturnValue(false);
    const { result } = renderHook(() => useHeader());

    const allLabels = result.current.menuItems.flatMap((menu) =>
      menu.items.map((item) => item.label),
    );

    expect(allLabels).not.toContain("Comunidade");
  });

  it("action de Comunidade navega para /community", () => {
    const { result } = renderHook(() => useHeader());

    const communityItem = result.current.menuItems
      .find((menu) => menu.label === "Comunidade")
      ?.items.find((item) => item.label === "Comunidade");

    communityItem?.action();

    expect(nextNavigationTestState.router.push).toHaveBeenCalledWith(
      "/community",
    );
  });

  it("não expõe Autores nem Administração para common-user", () => {
    const { result } = renderHook(() => useHeader());

    const allLabels = result.current.menuItems.flatMap((menu) =>
      menu.items.map((item) => item.label),
    );

    expect(allLabels).not.toContain("Autores");
    expect(allLabels).not.toContain("Administração");
  });

  it("expõe Autores e Administração para admin", () => {
    mockUseIsAdmin.mockReturnValue(true);
    const { result } = renderHook(() => useHeader());

    const allLabels = result.current.menuItems.flatMap((menu) =>
      menu.items.map((item) => item.label),
    );

    expect(allLabels).toContain("Autores");
    expect(allLabels).toContain("Administração");
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

describe("useHeader — destinações por superfície", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseIsLoggedIn.mockReturnValue(true);
    mockUseIsAdmin.mockReturnValue(false);
  });

  it("não inclui Autores, Administração, Adicionar Estante nem Perfil no desktopNavItems de common-user", () => {
    const { result } = renderHook(() => useHeader());
    const names = itemLabels(headerSurfaces(result.current).desktopNavItems);

    expect(names).toEqual([
      "Início",
      "Estatisticas",
      "Comunidade",
      "Ver Estantes",
    ]);
    expect(names).not.toContain("Autores");
    expect(names).not.toContain("Administração");
    expect(names).not.toContain("Adicionar Estante");
    expect(names).not.toContain("Perfil");
  });

  it("inclui Autores e Administração no desktopNavItems de admin", () => {
    mockUseIsAdmin.mockReturnValue(true);
    const { result } = renderHook(() => useHeader());
    const names = itemLabels(headerSurfaces(result.current).desktopNavItems);

    expect(names).toEqual([
      "Início",
      "Estatisticas",
      "Comunidade",
      "Ver Estantes",
      "Autores",
      "Administração",
    ]);
  });

  it("expõe Início, Estatisticas, Comunidade e Ver Estantes em mobilePrimaryItems quando autenticado", () => {
    const { result } = renderHook(() => useHeader());

    expect(itemLabels(headerSurfaces(result.current).mobilePrimaryItems)).toEqual(
      ["Início", "Estatisticas", "Comunidade", "Ver Estantes"],
    );
  });

  it("inclui Adicionar Estante, Perfil e Logout no overflow mobile de common-user e oculta Autores e Administração", () => {
    const { result } = renderHook(() => useHeader());
    const names = overflowLabels(result.current);

    expect(names).toContain("Adicionar Estante");
    expect(names).toContain("Perfil");
    expect(names).toContain("Logout");
    expect(names).not.toContain("Autores");
    expect(names).not.toContain("Administração");
  });

  it("expõe Autores e Administração no overflow mobile de admin", () => {
    mockUseIsAdmin.mockReturnValue(true);
    const { result } = renderHook(() => useHeader());
    const names = overflowLabels(result.current);

    expect(names).toContain("Autores");
    expect(names).toContain("Administração");
  });

  it("visitante calcula destinos públicos nas superfícies; o Header é o gate do chrome", () => {
    mockUseIsLoggedIn.mockReturnValue(false);
    const { result } = renderHook(() => useHeader());
    const surfaces = headerSurfaces(result.current);

    expect(itemLabels(surfaces.desktopNavItems)).toEqual([
      "Início",
      "Estatisticas",
      "Ver Estantes",
    ]);
    expect(itemLabels(surfaces.mobilePrimaryItems)).toEqual([
      "Início",
      "Estatisticas",
      "Ver Estantes",
    ]);
    expect(overflowLabels(result.current)).toEqual(["Adicionar Estante"]);
  });

  it("propaga requiresAuth e requiresAdmin nos itens ligados", () => {
    mockUseIsAdmin.mockReturnValue(true);
    const { result } = renderHook(() => useHeader());
    const all = result.current.menuItems.flatMap((menu) => menu.items);

    expect(all.find((item) => item.label === "Comunidade")).toEqual(
      expect.objectContaining({ requiresAuth: true, path: "/community" }),
    );
    expect(all.find((item) => item.label === "Autores")).toEqual(
      expect.objectContaining({ requiresAdmin: true, path: "/authors" }),
    );
  });

  it("abre o dialog de estante e chama logout nas actions correspondentes", () => {
    const { result } = renderHook(() => useHeader());
    const addShelf = result.current.mobileOverflowItems.find(
      (item) => item.label === "Adicionar Estante",
    );
    const logoutItem = result.current.mobileOverflowItems.find(
      (item) => item.label === "Logout",
    );

    addShelf?.action();
    logoutItem?.action();

    expect(mockSetIsOpen).toHaveBeenCalledWith(true);
    expect(mockLogout).toHaveBeenCalled();
  });
});
