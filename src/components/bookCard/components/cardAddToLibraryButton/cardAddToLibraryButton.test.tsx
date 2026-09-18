import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CardAddToLibraryButton from "./cardAddToLibraryButton";

describe("CardAddToLibraryButton", () => {
  it("dispara a ação de adicionar à biblioteca", () => {
    const onAddToLibrary = vi.fn();

    render(
      <CardAddToLibraryButton
        bookTitle="Memórias Póstumas"
        onAddToLibrary={onAddToLibrary}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: 'Adicionar "Memórias Póstumas" à minha biblioteca',
      }),
    );

    expect(onAddToLibrary).toHaveBeenCalledTimes(1);
  });

  it("desabilita o botão enquanto a ação está pendente", () => {
    render(
      <CardAddToLibraryButton
        bookTitle="Memórias Póstumas"
        onAddToLibrary={vi.fn()}
        isPending
      />,
    );

    expect(
      screen.getByRole("button", {
        name: 'Adicionar "Memórias Póstumas" à minha biblioteca',
      }),
    ).toBeDisabled();
  });
});
