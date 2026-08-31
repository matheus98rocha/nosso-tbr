import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import HomeAddBookButton from "./homeAddBookButton";

describe("HomeAddBookButton", () => {
  it("renderiza FAB acessível com label Adicionar livro no canto inferior esquerdo", () => {
    render(<HomeAddBookButton onClick={vi.fn()} />);

    const button = screen.getByRole("button", { name: "Adicionar livro" });
    expect(button).toBeInTheDocument();
    expect(button.className).toMatch(/fixed/);
    expect(button.className).toMatch(/left-6/);
    expect(button.className).toMatch(/bottom-6/);
  });

  it("dispara onClick ao clicar", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<HomeAddBookButton onClick={onClick} />);

    await user.click(screen.getByRole("button", { name: "Adicionar livro" }));

    expect(onClick).toHaveBeenCalledOnce();
  });
});
