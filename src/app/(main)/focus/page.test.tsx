import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import FocusPage, { metadata } from "./page";

vi.mock("@/modules/focus", () => ({
  default: () => <div>Foco de leitura</div>,
}));

describe("FocusPage", () => {
  it("renderiza a tela de foco", () => {
    render(<FocusPage />);

    expect(screen.getByText("Foco de leitura")).toBeInTheDocument();
  });

  it("define o título da página", () => {
    expect(metadata.title).toBe("Foco de leitura");
  });
});
