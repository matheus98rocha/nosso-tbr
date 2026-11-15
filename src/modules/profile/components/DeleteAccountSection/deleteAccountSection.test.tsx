import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ownAccountDeletionDescription } from "@/lib/users/accountDeletionCopy";

import DeleteAccountSection from "./deleteAccountSection";

function renderSection(isConfirmOpen: boolean) {
  const onOpenConfirm = vi.fn();
  const onCloseConfirm = vi.fn();
  const onConfirmOpenChange = vi.fn();
  const onConfirm = vi.fn().mockResolvedValue(undefined);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <QueryClientProvider client={client}>
      <DeleteAccountSection
        description={ownAccountDeletionDescription()}
        isConfirmOpen={isConfirmOpen}
        userId="user-1"
        onOpenConfirm={onOpenConfirm}
        onCloseConfirm={onCloseConfirm}
        onConfirmOpenChange={onConfirmOpenChange}
        onConfirm={onConfirm}
      />
    </QueryClientProvider>,
  );

  return { onOpenConfirm, onCloseConfirm, onConfirmOpenChange, onConfirm };
}

describe("DeleteAccountSection", () => {
  it("mostra o aviso irreversível e pede confirmação", async () => {
    const user = userEvent.setup();
    const { onOpenConfirm } = renderSection(false);

    expect(
      screen.getByRole("heading", { name: "Excluir conta" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Essa decisão não é reversível\./),
    ).toBeInTheDocument();
    expect(screen.getByText(/livros/)).toBeInTheDocument();
    expect(screen.getByText(/cronogramas/)).toBeInTheDocument();
    expect(screen.getByText(/notas/)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Excluir minha conta" }),
    );
    expect(onOpenConfirm).toHaveBeenCalledTimes(1);
  });

  it("repete o aviso no diálogo antes de confirmar", async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderSection(true);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getAllByText(/Essa decisão não é reversível\./).length,
    ).toBeGreaterThan(1);
    expect(screen.getAllByText(/livros/).length).toBeGreaterThan(1);
    expect(screen.getAllByText(/cronogramas/).length).toBeGreaterThan(1);
    expect(screen.getAllByText(/notas/).length).toBeGreaterThan(1);
    await user.click(screen.getByRole("button", { name: "Excluir conta" }));
    expect(onConfirm).toHaveBeenCalledWith("user-1");
  });
});
