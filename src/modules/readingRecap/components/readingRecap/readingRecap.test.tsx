import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("../readingRecapModal", () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div>modal-compartilhar-leituras</div> : null,
}));

import ReadingRecap from "./readingRecap";

describe("ReadingRecap", () => {
  it("mostra o botão Compartilhar leituras", () => {
    render(<ReadingRecap />);

    expect(
      screen.getByRole("button", { name: "Compartilhar leituras" }),
    ).toBeInTheDocument();
  });

  it("abre o modal ao clicar no botão", async () => {
    const user = userEvent.setup();
    render(<ReadingRecap />);

    await user.click(
      screen.getByRole("button", { name: "Compartilhar leituras" }),
    );

    expect(screen.getByText("modal-compartilhar-leituras")).toBeInTheDocument();
  });
});
