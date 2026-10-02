import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import BOOK_IMPORT_AI_PROMPT from "../services/bookImport/bookImportAiPrompt";
import useCopyBookImportPrompt from "./useCopyBookImportPrompt";

describe("useCopyBookImportPrompt", () => {
  it("copia o prompt pedindo a lista de livros e se quer as imagens", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    const { result } = renderHook(() => useCopyBookImportPrompt());

    await act(async () => {
      await result.current.copyPrompt();
    });

    expect(writeText).toHaveBeenCalledWith(BOOK_IMPORT_AI_PROMPT);
    expect(BOOK_IMPORT_AI_PROMPT).toContain("LISTA DE LIVROS:");
    expect(BOOK_IMPORT_AI_PROMPT).toContain("QUERO AS IMAGENS DAS CAPAS:");
    expect(result.current.copied).toBe(true);
  });
});
