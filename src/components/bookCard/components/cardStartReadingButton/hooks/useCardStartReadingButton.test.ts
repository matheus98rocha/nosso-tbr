import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useCardStartReadingButton } from "./useCardStartReadingButton";

describe("useCardStartReadingButton", () => {
  it("monta cópia de confirmação para iniciar leitura", () => {
    const { result } = renderHook(() =>
      useCardStartReadingButton({
        bookTitle: "Dom Casmurro",
        label: "Iniciar leitura",
        onStartReading: vi.fn(),
      }),
    );

    expect(result.current.confirmationCopy.title).toBe("Iniciar leitura?");
    expect(result.current.confirmationCopy.confirmLabel).toBe("Iniciar leitura");
    expect(result.current.confirmationCopy.description).toContain("Dom Casmurro");
  });

  it("monta cópia de confirmação para reiniciar leitura", () => {
    const { result } = renderHook(() =>
      useCardStartReadingButton({
        bookTitle: "Dom Casmurro",
        label: "Reiniciar leitura",
        onStartReading: vi.fn(),
      }),
    );

    expect(result.current.confirmationCopy.title).toBe("Reiniciar leitura?");
    expect(result.current.confirmationCopy.confirmLabel).toBe("Reiniciar leitura");
  });

  it("confirma a ação e fecha o modal", () => {
    const onStartReading = vi.fn();
    const { result } = renderHook(() =>
      useCardStartReadingButton({
        bookTitle: "Dom Casmurro",
        label: "Iniciar leitura",
        onStartReading,
      }),
    );

    act(() => {
      result.current.setConfirmationOpen(true);
    });
    act(() => {
      result.current.handleConfirm();
    });

    expect(onStartReading).toHaveBeenCalledTimes(1);
    expect(result.current.confirmationOpen).toBe(false);
  });
});
