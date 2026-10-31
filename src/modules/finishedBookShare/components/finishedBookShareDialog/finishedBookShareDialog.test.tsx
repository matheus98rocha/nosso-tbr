import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FINISHED_BOOK_SHARE_COPY } from "../../constants";
import type { FinishedBookShareSubject } from "../../types";
import { FinishedBookShareDialog } from "./finishedBookShareDialog";

const renderFinishedBookCardPng = vi.hoisted(() => vi.fn());
const triggerFinishedBookShareDownload = vi.hoisted(() => vi.fn());

vi.mock("../../utils/renderFinishedBookCardPng", () => ({
  renderFinishedBookCardPng,
  triggerFinishedBookShareDownload,
}));

vi.mock("sonner", () => ({ toast: vi.fn() }));

const subject: FinishedBookShareSubject = {
  bookId: "book-1",
  title: "Jogos Vorazes (Jogos Vorazes, #1)",
  author: "Suzanne Collins",
  imageUrl: null,
};

const text =
  "Terminei de ler “Jogos Vorazes (Jogos Vorazes, #1)”, de Suzanne Collins.";

function renderDialog() {
  return render(
    <FinishedBookShareDialog subject={subject} open onClose={vi.fn()} />,
  );
}

describe("FinishedBookShareDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:card");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  });

  it("mostra a geração com ações desabilitadas e depois o mesmo PNG", async () => {
    let resolveRender: (blob: Blob) => void = () => undefined;
    renderFinishedBookCardPng.mockImplementation(
      () =>
        new Promise<Blob>((resolve) => {
          resolveRender = resolve;
        }),
    );
    const user = userEvent.setup();
    const open = vi.spyOn(window, "open").mockReturnValue({} as Window);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    renderDialog();

    expect(screen.getByRole("heading", { name: FINISHED_BOOK_SHARE_COPY.dialogTitle })).toBeInTheDocument();
    expect(screen.getByText(FINISHED_BOOK_SHARE_COPY.generating)).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: FINISHED_BOOK_SHARE_COPY.download })).toBeDisabled();
    expect(screen.getByRole("button", { name: FINISHED_BOOK_SHARE_COPY.copyText })).toBeDisabled();
    expect(screen.getByRole("button", { name: FINISHED_BOOK_SHARE_COPY.openOnX })).toBeDisabled();

    const blob = new Blob(["png"], { type: "image/png" });
    await act(async () => {
      resolveRender(blob);
    });

    const image = await screen.findByRole("img", {
      name: "Cartão de leitura de “Jogos Vorazes (Jogos Vorazes, #1)”, de Suzanne Collins. Leitura em 100%.",
    });
    expect(image).toHaveAttribute("src", "blob:card");
    expect(screen.getByText(FINISHED_BOOK_SHARE_COPY.manualAttach)).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-busy", "false");

    await user.click(screen.getByRole("button", { name: FINISHED_BOOK_SHARE_COPY.download }));
    expect(triggerFinishedBookShareDownload).toHaveBeenCalledWith(
      blob,
      "jogos-vorazes-jogos-vorazes-1.png",
    );

    await user.click(screen.getByRole("button", { name: FINISHED_BOOK_SHARE_COPY.copyText }));
    await user.click(screen.getByRole("button", { name: FINISHED_BOOK_SHARE_COPY.openOnX }));

    expect(writeText).toHaveBeenCalledWith(text);
    expect(open).toHaveBeenCalledWith(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("mostra a frase de falha e não abre o X", async () => {
    renderFinishedBookCardPng.mockRejectedValue(
      new DOMException("tainted", "SecurityError"),
    );
    const user = userEvent.setup();
    const open = vi.spyOn(window, "open").mockReturnValue({} as Window);

    renderDialog();

    expect(await screen.findByText(FINISHED_BOOK_SHARE_COPY.generateError)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: FINISHED_BOOK_SHARE_COPY.retry })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: FINISHED_BOOK_SHARE_COPY.openOnX })).toBeDisabled();
    expect(open).not.toHaveBeenCalled();

    renderFinishedBookCardPng.mockResolvedValueOnce(
      new Blob(["png"], { type: "image/png" }),
    );
    await user.click(screen.getByRole("button", { name: FINISHED_BOOK_SHARE_COPY.retry }));
    await waitFor(() => {
      expect(renderFinishedBookCardPng).toHaveBeenCalledTimes(2);
    });
  });
});
