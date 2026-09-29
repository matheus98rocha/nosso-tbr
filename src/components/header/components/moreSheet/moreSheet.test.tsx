import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../hooks/useBottomNav", () => ({
  useBottomNav: (pathname: string) => ({
    isActive: (path?: string) => Boolean(path && path === pathname),
    handlePrefetch: vi.fn(),
    visibleLabel: (label: string) => label,
  }),
}));

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetClose: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

import MoreSheet from "./moreSheet";

describe("MoreSheet", () => {
  it("expõe o gatilho Mais e os destinos de overflow", () => {
    const onAdmin = vi.fn();

    render(
      <MoreSheet
        pathname="/stats"
        items={[
          { label: "Adicionar Estante", action: vi.fn() },
          { label: "Administração", path: "/admin", action: onAdmin },
        ]}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Abrir mais destinos" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Adicionar Estante")).toBeInTheDocument();
    expect(screen.getByText("Administração")).toBeInTheDocument();
  });

  it("não dispara ação do destino já ativo", () => {
    const onAdmin = vi.fn();

    render(
      <MoreSheet
        pathname="/admin"
        items={[{ label: "Administração", path: "/admin", action: onAdmin }]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Administração" }));
    expect(onAdmin).not.toHaveBeenCalled();
  });

  it("dispara action do destino inativo", () => {
    const onProfile = vi.fn();

    render(
      <MoreSheet
        pathname="/stats"
        items={[{ label: "Perfil", path: "/profile", action: onProfile }]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Perfil" }));
    expect(onProfile).toHaveBeenCalledOnce();
  });
});
