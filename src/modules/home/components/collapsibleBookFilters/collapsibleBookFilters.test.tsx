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

  it("shows active filter labels when collapsed by default", () => {
    render(
      <CollapsibleBookFilters activeFilterLabels={["Meus livros", "2024"]}>
        <div>filter-content</div>
      </CollapsibleBookFilters>,
    );

    expect(screen.getByText("Meus livros • 2024")).toBeInTheDocument();
  });
});
