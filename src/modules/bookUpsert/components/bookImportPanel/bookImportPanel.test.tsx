import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import BookImportPanel from "./bookImportPanel";
import type { BookImportPanelProps } from "./bookImportPanel.types";

function renderPanel(overrides: Partial<BookImportPanelProps> = {}) {
  const props: BookImportPanelProps = {
    fileName: null,
    fileSizeLabel: null,
    isDragging: false,
    onDragLeave: vi.fn(),
    onDragOver: vi.fn(),
    onDrop: vi.fn(),
    onFileInputChange: vi.fn(),
    onRemoveFile: vi.fn(),
    result: null,
    ...overrides,
  };

  render(<BookImportPanel {...props} />);

  return props;
}

describe("BookImportPanel", () => {
  it("copia um prompt que pede os nomes dos livros e se quer as imagens", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    renderPanel();

    await user.click(
      screen.getByRole("button", { name: "Copiar prompt para IA" }),
    );

    expect(writeText).toHaveBeenCalledOnce();
    const prompt = writeText.mock.calls[0][0] as string;
    expect(prompt).toContain("LISTA DE LIVROS:");
    expect(prompt).toContain("QUERO AS IMAGENS DAS CAPAS:");
    expect(
      screen.getByRole("button", { name: "Prompt copiado" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Cole no Gemini ou em outra IA. No texto, escreva o nome de cada livro e diga se quer as imagens das capas.",
      ),
    ).toBeInTheDocument();
  });

  it("mostra o nome do arquivo escolhido e o link do modelo", () => {
    renderPanel({
      fileName: "estante.csv",
      fileSizeLabel: "12 KB",
    });

    expect(screen.getByText("estante.csv")).toBeInTheDocument();
    expect(screen.getByText("12 KB")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Baixar modelo" })).toHaveAttribute(
      "href",
      "/modelo-importacao-livros.csv",
    );
  });

  it("remove o arquivo escolhido", async () => {
    const user = userEvent.setup();
    const props = renderPanel({
      fileName: "estante.csv",
      fileSizeLabel: "12 KB",
    });

    await user.click(screen.getByRole("button", { name: "Remover arquivo" }));

    expect(props.onRemoveFile).toHaveBeenCalledTimes(1);
  });

  it("esconde o resultado enquanto o pai não envia um", () => {
    renderPanel();

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("mostra uma mensagem quando o arquivo inteiro é recusado", () => {
    renderPanel({
      result: {
        kind: "refused",
        message: "Esse arquivo não deu para ler.",
      },
    });

    expect(screen.getByRole("status")).toHaveTextContent(
      "Esse arquivo não deu para ler.",
    );
    expect(
      screen.queryByText(
        "O livro não foi criado porque os dados ou as colunas são inválidos.",
      ),
    ).not.toBeInTheDocument();
  });

  it("mostra a contagem e o motivo de cada linha recusada", () => {
    renderPanel({
      result: {
        kind: "report",
        createdCount: 2,
        rejectedCount: 2,
        rejectedRows: [
          { title: "Dom Casmurro", reason: "duplicate" },
          { title: null, reason: "invalid" },
        ],
      },
    });

    expect(screen.getByRole("status")).toHaveTextContent("2 livros criados");
    expect(screen.getByRole("status")).toHaveTextContent(
      "2 livros não entraram",
    );
    expect(screen.getByText("Dom Casmurro")).toBeInTheDocument();
    expect(
      screen.getByText(
        "O livro não foi criado porque já está na sua biblioteca.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "O livro não foi criado porque os dados ou as colunas são inválidos.",
      ),
    ).toBeInTheDocument();
  });
});
