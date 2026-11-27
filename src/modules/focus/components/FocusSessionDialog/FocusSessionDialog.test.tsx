import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { FocusBook } from "../../types/focus.types";
import type { FocusSummaryInput } from "../../types/focus.types";
import FocusSessionDialog from "./FocusSessionDialog";

const book: FocusBook = {
  id: "book-1",
  title: "O nome do vento",
  author: "Patrick Rothfuss",
  authorIds: ["author-1"],
  imageUrl: "https://example.com/capa.jpg",
  pages: 200,
  currentPage: 30,
  readerIds: ["user-1"],
  chosenBy: "user-1",
  userId: "user-1",
  startDate: "2026-01-01",
  gender: "Fantasia",
  isReread: false,
  status: "reading",
};

const summary: FocusSummaryInput = {
  startedAt: "2026-01-01T12:00:00Z",
  finishedAt: "2026-01-01T12:25:00Z",
  durationSeconds: 1500,
  mode: "timer",
  book,
  goalPages: 20,
  estimatedPages: 25,
};

describe("FocusSessionDialog", () => {
  it("pré-sugere a página final a partir da meta", () => {
    render(
      <FocusSessionDialog
        summary={summary}
        suggestedPage={50}
        isSaving={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText("Registrar sua leitura")).toBeInTheDocument();
    expect(screen.getByLabelText("Página final")).toHaveValue(50);
    expect(screen.getByText(/Você estava na página 30 de 200/)).toBeInTheDocument();
  });

  it("registra a página informada pelo leitor", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <FocusSessionDialog
        summary={summary}
        suggestedPage={50}
        isSaving={false}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    const input = screen.getByLabelText("Página final");
    await user.clear(input);
    await user.type(input, "48");
    await user.click(screen.getByRole("button", { name: "Salvar sessão" }));

    expect(onConfirm).toHaveBeenCalledWith(48);
  });

  it("permite cancelar o registro", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <FocusSessionDialog
        summary={summary}
        suggestedPage={50}
        isSaving={false}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("usa páginas lidas no modo livre", () => {
    render(
      <FocusSessionDialog
        summary={{ ...summary, book: null }}
        suggestedPage={12}
        isSaving={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Páginas lidas")).toHaveValue(12);
  });
});
