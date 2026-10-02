import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import useImportBooks from "./useImportBooks";

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return {
    Wrapper({ children }: { children: ReactNode }) {
      return createElement(QueryClientProvider, { client }, children);
    },
  };
}

function csvFile() {
  return new File(["titulo,autor"], "livros.csv", { type: "text/csv" });
}

describe("useImportBooks", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fecha o formulário quando todos os livros do arquivo são criados", async () => {
    const onImported = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          kind: "report",
          createdCount: 5,
          rejectedCount: 0,
          rejectedRows: [],
        }),
      }),
    );
    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () => useImportBooks({ isOpen: true, onImported }),
      { wrapper: Wrapper },
    );

    await act(async () => {
      await result.current.importFile(csvFile());
    });

    expect(onImported).toHaveBeenCalledOnce();
  });

  it("mantém o formulário aberto quando algum livro não entra", async () => {
    const onImported = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          kind: "report",
          createdCount: 1,
          rejectedCount: 1,
          rejectedRows: [{ title: "Duplicado", reason: "duplicate" }],
        }),
      }),
    );
    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () => useImportBooks({ isOpen: true, onImported }),
      { wrapper: Wrapper },
    );

    await act(async () => {
      await result.current.importFile(csvFile());
    });

    expect(onImported).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(result.current.result?.kind).toBe("report");
    });
  });

  it("mantém o formulário aberto quando o arquivo é recusado", async () => {
    const onImported = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          kind: "refused",
          message: "Esse arquivo não tem a coluna de páginas.",
        }),
      }),
    );
    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () => useImportBooks({ isOpen: true, onImported }),
      { wrapper: Wrapper },
    );

    await act(async () => {
      await result.current.importFile(csvFile());
    });

    expect(onImported).not.toHaveBeenCalled();
    expect(result.current.result).toEqual({
      kind: "refused",
      message: "Esse arquivo não tem a coluna de páginas.",
    });
  });
});
