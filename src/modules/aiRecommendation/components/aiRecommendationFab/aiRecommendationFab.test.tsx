import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FAB_BOTTOM_CLASS } from "@/constants/floatingActionButton";

import AiRecommendationFab from "./aiRecommendationFab";

describe("AiRecommendationFab", () => {
  it("renderiza FAB acessível ancorado na inferior direita com folga, nunca no topo", () => {
    render(<AiRecommendationFab onClick={vi.fn()} />);

    const button = screen.getByRole("button", {
      name: "Pedir indicação de leitura para a IA",
    });
    expect(button).toBeInTheDocument();
    expect(button.className).toMatch(/fixed/);
    expect(button.className).toMatch(/right-6/);
    expect(button.className).toContain(FAB_BOTTOM_CLASS);
    expect(button.className).not.toMatch(/(^|\s)top-/);
    expect(button.className).not.toMatch(/\bbottom-6\b/);
  });

  it("dispara onClick ao clicar", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<AiRecommendationFab onClick={onClick} />);

    await user.click(
      screen.getByRole("button", {
        name: "Pedir indicação de leitura para a IA",
      }),
    );

    expect(onClick).toHaveBeenCalledOnce();
  });
});
