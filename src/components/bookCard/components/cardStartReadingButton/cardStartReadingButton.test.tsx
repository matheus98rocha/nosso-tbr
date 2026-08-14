import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CardStartReadingButton from "./cardStartReadingButton";

describe("CardStartReadingButton", () => {
  it("abre confirmação antes de iniciar a leitura", () => {
    const onStartReading = vi.fn();

    render(
      <CardStartReadingButton
        bookTitle="Memórias Póstumas"
        onStartReading={onStartReading}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Iniciar leitura" }));

    expect(onStartReading).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Iniciar leitura?")).toBeInTheDocument();
  });

  it("confirma a ação somente após o usuário aceitar no modal", () => {
    const onStartReading = vi.fn();

    render(
      <CardStartReadingButton
        bookTitle="Memórias Póstumas"
        label="Reiniciar leitura"
        onStartReading={onStartReading}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Reiniciar leitura" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Reiniciar leitura", hidden: false }),
    );

    expect(onStartReading).toHaveBeenCalledTimes(1);
  });
});
