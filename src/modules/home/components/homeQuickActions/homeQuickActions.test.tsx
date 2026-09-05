import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { FAB_BOTTOM_CLASS } from "@/constants/floatingActionButton";

import HomeQuickActions from "./homeQuickActions";

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe("HomeQuickActions", () => {
  it("renderiza dock central inferior com as duas ações, nunca no topo", () => {
    render(
      <HomeQuickActions
        onAddBook={vi.fn()}
        onRequestRecommendation={vi.fn()}
      />,
    );

    const dock = screen.getByRole("navigation", {
      name: "Ações rápidas da estante",
    });
    expect(dock.className).toMatch(/fixed/);
    expect(dock.className).toMatch(/left-1\/2/);
    expect(dock.className).toContain(FAB_BOTTOM_CLASS);
    expect(dock.className).not.toMatch(/(^|\s)top-/);
    expect(dock.className).not.toMatch(/\bbottom-6\b/);

    expect(
      screen.getByRole("button", { name: "Adicionar livro" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Pedir indicação de leitura para a IA",
      }),
    ).toBeInTheDocument();
  });

  it("exibe labels em uma linha e tooltips explicativos", async () => {
    const user = userEvent.setup();

    render(
      <HomeQuickActions
        onAddBook={vi.fn()}
        onRequestRecommendation={vi.fn()}
      />,
    );

    expect(screen.getByText("Adicionar livro")).toBeInTheDocument();
    expect(screen.getByText("Indicação com IA")).toBeInTheDocument();

    await user.hover(screen.getByRole("button", { name: "Adicionar livro" }));
    expect(
      await screen.findByRole("tooltip", {
        name: "Cadastre um novo livro na sua lista de leitura",
      }),
    ).toBeInTheDocument();

    await user.hover(
      screen.getByRole("button", {
        name: "Pedir indicação de leitura para a IA",
      }),
    );
    expect(
      await screen.findByRole("tooltip", {
        name: "Peça uma sugestão de leitura gerada por inteligência artificial",
      }),
    ).toBeInTheDocument();
  });

  it("dispara callbacks ao clicar nas ações", async () => {
    const user = userEvent.setup();
    const onAddBook = vi.fn();
    const onRequestRecommendation = vi.fn();

    render(
      <HomeQuickActions
        onAddBook={onAddBook}
        onRequestRecommendation={onRequestRecommendation}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Adicionar livro" }));
    await user.click(
      screen.getByRole("button", {
        name: "Pedir indicação de leitura para a IA",
      }),
    );

    expect(onAddBook).toHaveBeenCalledOnce();
    expect(onRequestRecommendation).toHaveBeenCalledOnce();
  });
});
