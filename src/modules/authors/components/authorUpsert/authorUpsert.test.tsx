import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AuthorUpsert from "./authorUpsert";

const { createAuthor, editAuthor } = vi.hoisted(() => ({
  createAuthor: vi.fn(),
  editAuthor: vi.fn(),
}));

vi.mock("../../services/authors.service", () => ({
  AuthorsService: class AuthorsService {
    createAuthor = createAuthor;
    editAuthor = editAuthor;
  },
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    error: vi.fn(),
  }),
}));

function renderUpsert(
  props: Partial<ComponentProps<typeof AuthorUpsert>> = {},
) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const onOpenChange = vi.fn();
  const onSuccess = vi.fn();

  render(
    <QueryClientProvider client={client}>
      <AuthorUpsert
        isOpen
        mode="create"
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
        {...props}
      />
    </QueryClientProvider>,
  );

  return { onOpenChange, onSuccess };
}

describe("AuthorUpsert", () => {
  beforeEach(() => {
    createAuthor.mockReset();
    editAuthor.mockReset();
  });

  it("mantém o modal aberto e mostra o conflito de nome", async () => {
    const user = userEvent.setup();
    createAuthor.mockRejectedValue(
      new Error("Já existe um autor com esse nome."),
    );
    const { onOpenChange, onSuccess } = renderUpsert();

    await user.type(
      screen.getByPlaceholderText("Ex: Stephen King"),
      "  Colleen Hoover  ",
    );
    await user.click(screen.getByRole("button", { name: "Salvar Autor" }));

    expect(createAuthor).toHaveBeenCalledWith("Colleen Hoover");
    expect(
      await screen.findByText("Já existe um autor com esse nome."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: "Cadastrar Novo Autor" }),
    ).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("mantém a edição aberta quando o novo nome já existe", async () => {
    const user = userEvent.setup();
    editAuthor.mockRejectedValue(
      new Error("Já existe um autor com esse nome."),
    );
    const { onOpenChange, onSuccess } = renderUpsert({
      mode: "edit",
      authorId: "auth-1",
      defaultName: "Ana",
    });

    const input = screen.getByPlaceholderText("Ex: Stephen King");
    await user.clear(input);
    await user.type(input, "  Machado de Assis  ");
    await user.click(
      screen.getByRole("button", { name: "Salvar Alterações" }),
    );

    expect(editAuthor).toHaveBeenCalledWith("Machado de Assis", "auth-1");
    expect(
      await screen.findByText("Já existe um autor com esse nome."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: "Editar Autor" }),
    ).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("não grava nome só com espaços", async () => {
    const user = userEvent.setup();
    renderUpsert();

    await user.type(screen.getByPlaceholderText("Ex: Stephen King"), "   ");
    await user.click(screen.getByRole("button", { name: "Salvar Autor" }));

    expect(createAuthor).not.toHaveBeenCalled();
    expect(
      await screen.findByText("O nome do autor é obrigatório"),
    ).toBeInTheDocument();
  });

  it("fecha o modal só depois de criar o autor", async () => {
    const user = userEvent.setup();
    createAuthor.mockResolvedValue({ id: "a1", name: "Clarice" });
    const { onOpenChange, onSuccess } = renderUpsert();

    await user.type(
      screen.getByPlaceholderText("Ex: Stephen King"),
      "Clarice",
    );
    await user.click(screen.getByRole("button", { name: "Salvar Autor" }));

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
    expect(onSuccess).toHaveBeenCalledWith("a1");
  });
});
