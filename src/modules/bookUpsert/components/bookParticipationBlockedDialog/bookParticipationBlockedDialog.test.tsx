import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BookParticipationBlockedDialog } from "./bookParticipationBlockedDialog";

describe("BookParticipationBlockedDialog", () => {
  it("exibe título e descrição quando aberto", () => {
    render(
      <BookParticipationBlockedDialog
        open
        bookTitle="O Hobbit"
        onDismiss={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("dialog", { name: "Você já participa desta leitura" }),
    ).toBeInTheDocument();
    expect(screen.getByText("O Hobbit")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entendi" })).toBeInTheDocument();
  });

  it("chama onDismiss ao clicar em Entendi", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();

    render(
      <BookParticipationBlockedDialog
        open
        bookTitle={null}
        onDismiss={onDismiss}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Entendi" }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
