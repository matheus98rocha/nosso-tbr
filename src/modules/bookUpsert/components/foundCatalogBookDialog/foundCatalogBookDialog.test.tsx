import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FoundCatalogBookDialog } from "./foundCatalogBookDialog";
import type { BookCatalogMatchResult } from "../../types/bookDiscovery.types";

vi.mock("next/image", () => ({
  default: function MockImage({ src, alt }: { src: string; alt: string }) {
    // eslint-disable-next-line @next/next/no-img-element -- mock intencional para Vitest
    return <img src={src} alt={alt} />;
  },
}));

const baseMatch: BookCatalogMatchResult = {
  kind: "exact",
  userAlreadyLinked: false,
  suggestJoinEligible: true,
  candidate: {
    id: "book-1",
    title: "Livro Teste",
    authorId: "a1",
    authorName: "Autor Teste",
    imageUrl: "https://example.com/cover.jpg",
    pages: 288,
    readers: [],
    chosenBy: null,
    chosenByDisplayName: null,
    status: "not_started",
  },
};

describe("FoundCatalogBookDialog", () => {
  it("exibe título do diálogo, dados do candidato e botões de ação", () => {
    render(
      <FoundCatalogBookDialog
        open
        matchedBook={baseMatch}
        onAddExisting={vi.fn()}
        onIgnoreAndCreate={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("dialog", { name: "Livro encontrado no catálogo" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Livro Teste")).toBeInTheDocument();
    expect(screen.getByText("Autor Teste")).toBeInTheDocument();
    expect(screen.getByText("288")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Voltar ao formulário" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cadastrar um livro novo" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Participar desta leitura" }),
    ).toBeInTheDocument();
  });

  it("chama onAddExisting ao clicar em Participar desta leitura", async () => {
    const user = userEvent.setup();
    const onAddExisting = vi.fn();

    render(
      <FoundCatalogBookDialog
        open
        matchedBook={baseMatch}
        onAddExisting={onAddExisting}
        onIgnoreAndCreate={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Participar desta leitura" }),
    );

    expect(onAddExisting).toHaveBeenCalledTimes(1);
  });

  it("exibe capa com alt descritivo quando há imageUrl", () => {
    render(
      <FoundCatalogBookDialog
        open
        matchedBook={baseMatch}
        onAddExisting={vi.fn()}
        onIgnoreAndCreate={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("img", { name: "Capa de Livro Teste" }),
    ).toBeInTheDocument();
  });

  it("exibe nome de quem escolheu quando disponível", () => {
    render(
      <FoundCatalogBookDialog
        open
        matchedBook={{
          ...baseMatch,
          candidate: {
            ...baseMatch.candidate,
            chosenBy: "user-1",
            chosenByDisplayName: "Ana",
          },
        }}
        onAddExisting={vi.fn()}
        onIgnoreAndCreate={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText("Ana")).toBeInTheDocument();
  });

  it("desabilita ações enquanto isLinkingToExisting é true", () => {
    render(
      <FoundCatalogBookDialog
        open
        matchedBook={baseMatch}
        isLinkingToExisting
        onAddExisting={vi.fn()}
        onIgnoreAndCreate={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Voltar ao formulário" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Cadastrar um livro novo" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Participar desta leitura" }),
    ).toBeDisabled();
  });
});
