import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import CollapsibleBookFilters from "./collapsibleBookFilters";

describe("CollapsibleBookFilters", () => {
  it("starts collapsed by default", () => {
    render(
      <CollapsibleBookFilters>
        <div>filter-content</div>
      </CollapsibleBookFilters>,
    );

    expect(
      screen.getByRole("button", { name: "Expandir filtros de livros" }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("shows filter content after expanding", async () => {
    const user = userEvent.setup();

    render(
      <CollapsibleBookFilters>
        <div>filter-content</div>
      </CollapsibleBookFilters>,
    );

    await user.click(
      screen.getByRole("button", { name: "Expandir filtros de livros" }),
    );

    await waitFor(() => {
      expect(screen.getByText("filter-content")).toBeVisible();
    });
    expect(
      screen.getByRole("button", { name: "Recolher filtros de livros" }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("hides filter content when collapsed again", async () => {
    const user = userEvent.setup();

    render(
      <CollapsibleBookFilters>
        <div>filter-content</div>
      </CollapsibleBookFilters>,
    );

    await user.click(
      screen.getByRole("button", { name: "Expandir filtros de livros" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Recolher filtros de livros" }),
    );

    await waitFor(() => {
      expect(screen.getByText("filter-content")).not.toBeVisible();
    });
    expect(
      screen.getByRole("button", { name: "Expandir filtros de livros" }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("shows the active filter count in the mobile trigger", () => {
    render(
      <CollapsibleBookFilters activeFilterLabels={["Meus livros", "2024"]}>
        <div>filter-content</div>
      </CollapsibleBookFilters>,
    );

    expect(screen.getByText("2 ativos")).toBeInTheDocument();
  });

  it("opens grouped filters in a mobile sheet", async () => {
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: (query: string) => ({
        matches: query.includes("max-width"),
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }),
    });

    const user = userEvent.setup();
    render(
      <CollapsibleBookFilters onClearAll={() => {}}>
        <div>filter-content</div>
      </CollapsibleBookFilters>,
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Filtros/ })).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: /Filtros/ }));

    expect(screen.getByText("filter-content")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aplicar filtros" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Limpar tudo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: originalMatchMedia,
    });
  });

  it("shows active filter labels when collapsed by default", () => {
    render(
      <CollapsibleBookFilters activeFilterLabels={["Meus livros", "2024"]}>
        <div>filter-content</div>
      </CollapsibleBookFilters>,
    );

    expect(screen.getByText("Meus livros • 2024")).toBeInTheDocument();
  });
});
