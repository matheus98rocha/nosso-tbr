import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BOOK_COVER_PLACEHOLDER_SRC } from "@/constants/bookCover";

import type { RecapBook } from "../types";

const { getFinishedBooks } = vi.hoisted(() => ({
  getFinishedBooks: vi.fn(),
}));

vi.mock("@/utils/date", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/utils/date")>();
  return {
    ...actual,
    getTodayInSaoPaulo: () => new Date(2025, 2, 15, 12, 0, 0, 0),
  };
});

vi.mock("../services", () => ({
  ReadingRecapService: vi.fn(function ReadingRecapServiceMock(this: {
    getFinishedBooks: typeof getFinishedBooks;
  }) {
    this.getFinishedBooks = getFinishedBooks;
  }),
}));

vi.mock("@/stores/userStore", () => ({
  useUserStore: (selector: (state: { user: { id: string } | null }) => unknown) =>
    selector({ user: { id: "user-1" } }),
}));

vi.mock("@/stores/hooks/useAuth", () => ({
  useIsLoggedIn: () => true,
}));

import { useReadingRecap } from "./useReadingRecap";

const COVER = "https://m.media-amazon.com/images/I/81abc.jpg";

function recapBook(overrides: Partial<RecapBook> = {}): RecapBook {
  return {
    title: "Duna",
    endDate: "2026-10-07",
    gender: "science_fiction",
    imageUrl: COVER,
    ...overrides,
  };
}

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  };
}

function stubSucceedingImage() {
  class MockImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;

    set src(_value: string) {
      queueMicrotask(() => {
        this.onload?.();
      });
    }
  }

  vi.stubGlobal("Image", MockImage);
}

describe("useReadingRecap", () => {
  beforeEach(() => {
    stubSucceedingImage();
    getFinishedBooks.mockReset();
    getFinishedBooks.mockResolvedValue([
      recapBook({ endDate: "2025-03-15" }),
      recapBook({
        title: "Ontem",
        endDate: "2025-03-14",
        imageUrl: "https://m.media-amazon.com/images/I/ontem.jpg",
      }),
      recapBook({
        title: "Romance de março",
        endDate: "2025-03-15",
        gender: "romance",
        imageUrl: "https://m.media-amazon.com/images/I/romance.jpg",
      }),
    ]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("abre no ano civil de hoje em America/São_Paulo", async () => {
    const { result } = renderHook(() => useReadingRecap(true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(getFinishedBooks).toHaveBeenCalledWith("user-1");
    expect(result.current.filter.period).toEqual({
      kind: "year",
      year: 2025,
      month: 3,
      day: 15,
    });
    expect(result.current.filter.genders).toEqual([]);
    expect(result.current.isGenderFilterEnabled).toBe(false);
    expect(result.current.periodTitle).toBe("Leituras do ano 2025");
    expect(result.current.countLabel).toBe("3 capas neste recap");
    expect(result.current.isShellPending).toBe(false);
  });

  it("mantém o shell pendente enquanto o probe das capas não termina", async () => {
    const loaders: Array<() => void> = [];
    class HangImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        loaders.push(() => this.onload?.());
      }
    }
    vi.stubGlobal("Image", HangImage);

    const { result } = renderHook(() => useReadingRecap(true), {
      wrapper: createWrapper(),
    });

    expect(result.current.isShellPending).toBe(true);

    await waitFor(() => {
      expect(result.current.isProbing).toBe(true);
      expect(loaders.length).toBeGreaterThan(0);
    });
    expect(result.current.isShellPending).toBe(true);
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      for (const load of loaders) load();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.isShellPending).toBe(false);
  });

  it("devolve imagens vazias quando os livros do ano só têm capa placeholder", async () => {
    getFinishedBooks.mockResolvedValueOnce([
      recapBook({
        title: "Sem capa cadastrada",
        endDate: "2025-03-15",
        imageUrl: BOOK_COVER_PLACEHOLDER_SRC,
      }),
      recapBook({
        title: "Capa nula",
        endDate: "2025-03-15",
        imageUrl: null,
      }),
    ]);

    const { result } = renderHook(() => useReadingRecap(true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.images).toEqual([]);
    expect(result.current.isEmpty).toBe(true);
    expect(result.current.canDownload).toBe(false);
  });

  it("na lista mista do ano entrega capas que a Home mostraria", async () => {
    getFinishedBooks.mockResolvedValueOnce([
      recapBook({
        title: "Com capa",
        endDate: "2025-03-15",
        imageUrl: COVER,
      }),
      recapBook({
        title: "Placeholder",
        endDate: "2025-03-15",
        imageUrl: BOOK_COVER_PLACEHOLDER_SRC,
      }),
      recapBook({
        title: "Path local",
        endDate: "2025-03-15",
        imageUrl: "/x.svg",
      }),
      recapBook({
        title: "Host inválido",
        endDate: "2025-03-15",
        imageUrl: "https://example.com/cover.jpg",
      }),
    ]);

    const { result } = renderHook(() => useReadingRecap(true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.images).toHaveLength(1);
    expect(result.current.images[0]?.coverSrcs).toEqual([COVER, "/x.svg"]);
    expect(result.current.canDownload).toBe(true);
  });

  it("desabilita download quando o período filtrado está vazio", async () => {
    getFinishedBooks.mockResolvedValueOnce([
      recapBook({ title: "Outro ano", endDate: "2024-03-14" }),
    ]);

    const { result } = renderHook(() => useReadingRecap(true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isEmpty).toBe(true);
    expect(result.current.canDownload).toBe(false);
    expect(result.current.images).toEqual([]);
  });

  it("habilita download quando há capas no recap do ano", async () => {
    const { result } = renderHook(() => useReadingRecap(true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.canDownload).toBe(true);
    });

    expect(result.current.images[0]?.coverSrcs.length).toBeGreaterThan(0);
  });

  it("ao mudar para mês, inclui leituras do mês da âncora", async () => {
    const { result } = renderHook(() => useReadingRecap(true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.handlePeriodKindChange("month");
    });

    expect(result.current.filter.period.kind).toBe("month");
    expect(result.current.filter.period.month).toBe(3);

    await waitFor(() => {
      expect(result.current.images[0]?.coverSrcs).toHaveLength(3);
    });
    expect(result.current.periodTitle).toBe("Leituras de março de 2025");
    expect(result.current.isShellPending).toBe(false);
  });

  it("ao mudar para dia, inclui só as leituras do dia da âncora", async () => {
    const { result } = renderHook(() => useReadingRecap(true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.handlePeriodKindChange("day");
    });

    await waitFor(() => {
      expect(result.current.filter.period.kind).toBe("day");
      expect(result.current.images[0]?.coverSrcs).toEqual([
        COVER,
        "https://m.media-amazon.com/images/I/romance.jpg",
      ]);
    });
    expect(result.current.periodTitle).toBe("Leituras de 15 de março de 2025");
  });

  it("filtro de gênero atualiza o preview e o subtítulo", async () => {
    const { result } = renderHook(() => useReadingRecap(true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.handleToggleGender("romance");
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.filter.genders).toEqual(["romance"]);
    });
    expect(result.current.images[0]?.subtitle).toBe("Romance");
    expect(result.current.images[0]?.coverSrcs).toEqual([
      "https://m.media-amazon.com/images/I/romance.jpg",
    ]);
  });

  it("pagina 14 capas cadastradas em 12+2 depois do probe", async () => {
    getFinishedBooks.mockResolvedValueOnce(
      Array.from({ length: 14 }, (_, index) =>
        recapBook({
          title: `Livro ${String(index + 1).padStart(2, "0")}`,
          endDate: "2025-03-15",
          imageUrl: `https://m.media-amazon.com/images/I/${index}.jpg`,
        }),
      ),
    );

    const { result } = renderHook(() => useReadingRecap(true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.images).toHaveLength(2);
    expect(result.current.images[0]?.coverSrcs).toHaveLength(12);
    expect(result.current.images[1]?.coverSrcs).toHaveLength(2);
  });

  it("reparte para 12+1 depois de markCoverFailed em uma capa", async () => {
    const failed = "https://m.media-amazon.com/images/I/0.jpg";
    getFinishedBooks.mockResolvedValueOnce(
      Array.from({ length: 14 }, (_, index) =>
        recapBook({
          title: `Livro ${String(index + 1).padStart(2, "0")}`,
          endDate: "2025-03-15",
          imageUrl: `https://m.media-amazon.com/images/I/${index}.jpg`,
        }),
      ),
    );

    const { result } = renderHook(() => useReadingRecap(true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.images).toHaveLength(2);
      expect(result.current.images[1]?.coverSrcs).toHaveLength(2);
    });

    act(() => {
      result.current.markCoverFailed(failed);
    });

    expect(result.current.images).toHaveLength(2);
    expect(result.current.images[0]?.coverSrcs).toHaveLength(12);
    expect(result.current.images[1]?.coverSrcs).toHaveLength(1);
    expect(
      result.current.images.flatMap((image) => image.coverSrcs),
    ).not.toContain(failed);
  });

  it("handleSelectImage vai direto para o índice informado", async () => {
    getFinishedBooks.mockResolvedValue(
      Array.from({ length: 13 }, (_, index) =>
        recapBook({
          title: `Livro ${String(index + 1).padStart(2, "0")}`,
          endDate: "2025-03-15",
          imageUrl: `https://m.media-amazon.com/images/I/${index}.jpg`,
        }),
      ),
    );

    const { result } = renderHook(() => useReadingRecap(true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.images).toHaveLength(2);
    });

    expect(result.current.imageIndex).toBe(0);

    act(() => {
      result.current.handleSelectImage(1);
    });

    expect(result.current.imageIndex).toBe(1);
    expect(result.current.currentImage?.title).toContain("2/2");

    act(() => {
      result.current.handleSelectImage(0);
    });

    expect(result.current.imageIndex).toBe(0);
  });

  it("não busca livros enquanto o modal está fechado", () => {
    renderHook(() => useReadingRecap(false), {
      wrapper: createWrapper(),
    });

    expect(getFinishedBooks).not.toHaveBeenCalled();
  });

  it("desliga o filtro de gênero e limpa a seleção", async () => {
    const { result } = renderHook(() => useReadingRecap(true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.handleGenderFilterEnabledChange(true);
      result.current.handleToggleGender("romance");
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isGenderFilterEnabled).toBe(true);
      expect(result.current.filter.genders).toEqual(["romance"]);
    });

    act(() => {
      result.current.handleGenderFilterEnabledChange(false);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isGenderFilterEnabled).toBe(false);
      expect(result.current.filter.genders).toEqual([]);
    });
  });

  it("ao reabrir o modal volta ao ano de hoje e descarta o filtro", async () => {
    const { result, rerender } = renderHook(
      ({ isOpen }: { isOpen: boolean }) => useReadingRecap(isOpen),
      {
        wrapper: createWrapper(),
        initialProps: { isOpen: true },
      },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.handlePeriodKindChange("day");
      result.current.handleGenderFilterEnabledChange(true);
      result.current.handleToggleGender("romance");
    });

    expect(result.current.filter.period.kind).toBe("day");
    expect(result.current.filter.genders).toEqual(["romance"]);
    expect(result.current.isGenderFilterEnabled).toBe(true);

    rerender({ isOpen: false });
    rerender({ isOpen: true });

    await waitFor(() => {
      expect(result.current.filter.period).toEqual({
        kind: "year",
        year: 2025,
        month: 3,
        day: 15,
      });
    });
    expect(result.current.filter.genders).toEqual([]);
    expect(result.current.isGenderFilterEnabled).toBe(false);
  });
});
