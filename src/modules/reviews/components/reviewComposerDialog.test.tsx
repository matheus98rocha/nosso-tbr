import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { resetReviewComposerStore, useReviewComposerStore } from "../stores";
import ReviewComposerDialog from "./reviewComposerDialog";

function renderDialog() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ReviewComposerDialog />
    </QueryClientProvider>,
  );
}

describe("ReviewComposerDialog", () => {
  beforeEach(() => {
    resetReviewComposerStore();
  });

  it("mostra o contador e publica quando há estrelas e texto", async () => {
    useReviewComposerStore.setState({
      open: true,
      mode: "compose",
      book: {
        id: "book-1",
        title: "O Hobbit",
        author: "Tolkien",
        imageUrl: null,
        status: "finished",
        isSolo: false,
      },
    });
    const user = userEvent.setup();
    renderDialog();

    expect(screen.getByText("Leitura finalizada")).toBeInTheDocument();
    expect(screen.getByText("0/500")).toBeInTheDocument();
    const field = screen.getByLabelText("O que você achou");
    await user.click(screen.getByRole("button", { name: "5 estrelas (ótima)" }));
    await user.type(field, "Oi");
    expect(field).toHaveValue("Oi");
    expect(document.getElementById("review-content-count")).toHaveTextContent("2/500");
    expect(screen.getByRole("button", { name: "Publicar resenha" })).toBeEnabled();
  });

  it("na finalização, sem texto, salva só a avaliação", async () => {
    useReviewComposerStore.setState({
      open: true,
      mode: "finish",
      book: {
        id: "book-1",
        title: "O Hobbit",
        author: null,
        imageUrl: null,
        status: "finished",
        isSolo: true,
      },
    });
    const user = userEvent.setup();
    renderDialog();

    expect(screen.getByText(/Livro privado/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "4 estrelas" }));
    expect(screen.getByRole("button", { name: "Salvar avaliação" })).toBeEnabled();
  });

  it("bloqueia as estrelas quando a leitura não está finalizada", async () => {
    useReviewComposerStore.setState({
      open: true,
      mode: "compose",
      book: {
        id: "book-2",
        title: "1984",
        author: "George Orwell",
        imageUrl: null,
        status: "reading",
        isSolo: false,
      },
    });
    const user = userEvent.setup();
    renderDialog();

    expect(screen.getByText("Lendo agora")).toBeInTheDocument();
    expect(
      screen.getByText("As estrelas ficam disponíveis quando a leitura está finalizada."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "5 estrelas (ótima)" })).toBeDisabled();
    await user.type(screen.getByLabelText("O que você achou"), "Ainda lendo");
    expect(screen.getByRole("button", { name: "Publicar resenha" })).toBeDisabled();
  });
});
