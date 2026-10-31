import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FINISHED_BOOK_SHARE_COPY } from "../constants";
import type { FinishedBookShareSubject } from "../types";
import { useFinishedBookShareDialog } from "./useFinishedBookShareDialog";

const renderFinishedBookCardPng = vi.hoisted(() => vi.fn());
const triggerFinishedBookShareDownload = vi.hoisted(() => vi.fn());

vi.mock("../utils/renderFinishedBookCardPng", () => ({
  renderFinishedBookCardPng,
  triggerFinishedBookShareDownload,
}));

vi.mock("sonner", () => ({ toast: vi.fn() }));

import { toast } from "sonner";

const subject: FinishedBookShareSubject = {
  bookId: "book-1",
  title: "Jogos Vorazes (Jogos Vorazes, #1)",
  author: "Suzanne Collins",
  imageUrl: null,
};

const text =
  "Terminei de ler “Jogos Vorazes (Jogos Vorazes, #1)”, de Suzanne Collins.";

describe("useFinishedBookShareDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:card");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  });

  it("desabilita as ações enquanto gera e revoga o object URL ao desmontar", async () => {
    let resolveRender: (blob: Blob) => void = () => undefined;
    renderFinishedBookCardPng.mockImplementation(
      () =>
        new Promise<Blob>((resolve) => {
          resolveRender = resolve;
        }),
    );
    const open = vi.spyOn(window, "open").mockReturnValue({} as Window);

    const { result, unmount } = renderHook(() => useFinishedBookShareDialog(subject));

    expect(result.current.actionsDisabled).toBe(true);
    act(() => {
      result.current.openOnX();
    });
    expect(open).not.toHaveBeenCalled();

    const blob = new Blob(["png"], { type: "image/png" });
    await act(async () => {
      resolveRender(blob);
    });

    await waitFor(() => {
      expect(result.current.phase).toBe("ready");
    });
    expect(result.current.objectUrl).toBe("blob:card");
    expect(result.current.actionsDisabled).toBe(false);

    act(() => {
      result.current.download();
    });
    expect(triggerFinishedBookShareDownload).toHaveBeenCalledWith(
      blob,
      "jogos-vorazes-jogos-vorazes-1.png",
    );

    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:card");
  });

  it("copia e abre a mesma string do intent", async () => {
    renderFinishedBookCardPng.mockResolvedValue(new Blob(["png"], { type: "image/png" }));
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const open = vi.spyOn(window, "open").mockReturnValue({} as Window);

    const { result } = renderHook(() => useFinishedBookShareDialog(subject));
    await waitFor(() => expect(result.current.phase).toBe("ready"));

    await act(async () => {
      await result.current.copyText();
    });
    act(() => {
      result.current.openOnX();
    });

    expect(writeText).toHaveBeenCalledWith(text);
    expect(open).toHaveBeenCalledWith(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
    expect(result.current.model.text).toBe(text);
    expect(result.current.model.intentUrl).toContain(encodeURIComponent(text));
  });

  it("mostra a frase de erro e não abre o X, inclusive em SecurityError", async () => {
    renderFinishedBookCardPng.mockRejectedValue(
      new DOMException("tainted", "SecurityError"),
    );
    const open = vi.spyOn(window, "open").mockReturnValue({} as Window);

    const { result } = renderHook(() => useFinishedBookShareDialog(subject));
    await waitFor(() => expect(result.current.phase).toBe("error"));

    expect(result.current.errorMessage).toBe(FINISHED_BOOK_SHARE_COPY.generateError);
    act(() => {
      result.current.openOnX();
    });
    expect(open).not.toHaveBeenCalled();
  });

  it("tenta de novo depois da falha", async () => {
    renderFinishedBookCardPng
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce(new Blob(["png"], { type: "image/png" }));

    const { result } = renderHook(() => useFinishedBookShareDialog(subject));
    await waitFor(() => expect(result.current.phase).toBe("error"));

    act(() => {
      result.current.retry();
    });

    await waitFor(() => expect(result.current.phase).toBe("ready"));
    expect(renderFinishedBookCardPng).toHaveBeenCalledTimes(2);
  });

  it("avisa quando a cópia ou o pop-up falham e mantém o diálogo pronto", async () => {
    renderFinishedBookCardPng.mockResolvedValue(new Blob(["png"], { type: "image/png" }));
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    vi.spyOn(window, "open").mockReturnValue(null);

    const { result } = renderHook(() => useFinishedBookShareDialog(subject));
    await waitFor(() => expect(result.current.phase).toBe("ready"));

    await act(async () => {
      await result.current.copyText();
    });
    act(() => {
      result.current.openOnX();
    });

    expect(toast).toHaveBeenCalledWith(FINISHED_BOOK_SHARE_COPY.copyFailed);
    expect(toast).toHaveBeenCalledWith(FINISHED_BOOK_SHARE_COPY.popupBlocked);
    expect(result.current.phase).toBe("ready");
  });

  it("revoga o object URL ao trocar o assunto", async () => {
    renderFinishedBookCardPng.mockResolvedValue(new Blob(["png"], { type: "image/png" }));
    const { result, rerender } = renderHook(
      ({ item }) => useFinishedBookShareDialog(item),
      { initialProps: { item: subject } },
    );
    await waitFor(() => expect(result.current.phase).toBe("ready"));

    rerender({
      item: { ...subject, bookId: "book-2", title: "Outro livro" },
    });

    await waitFor(() => {
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:card");
    });
  });
});
