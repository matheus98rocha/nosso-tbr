import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FAB_BOTTOM_CLASS } from "@/constants/floatingActionButton";

import HomeAddBookButton from "./homeAddBookButton";

describe("HomeAddBookButton", () => {
  it("renderiza FAB acessível ancorado na inferior esquerda com folga, nunca no topo", () => {
    render(<HomeAddBookButton onClick={vi.fn()} />);

    const button = screen.getByRole("button", { name: "Adicionar livro" });
    expect(button).toBeInTheDocument();
    expect(button.className).toMatch(/fixed/);
    expect(button.className).toMatch(/left-6/);
    expect(button.className).toContain(FAB_BOTTOM_CLASS);
    expect(button.className).not.toMatch(/(^|\s)top-/);
    expect(button.className).not.toMatch(/\bbottom-6\b/);
  });

  it("dispara onClick ao clicar", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<HomeAddBookButton onClick={onClick} />);

    await user.click(screen.getByRole("button", { name: "Adicionar livro" }));

    expect(onClick).toHaveBeenCalledOnce();
  });
});
