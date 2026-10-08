import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

describe("useReadingRecap", () => {
  beforeEach(() => {
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

  it("abre no dia civil de hoje em America/São_Paulo", async () => {
    const { result } = renderHook(() => useReadingRecap(true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(getFinishedBooks).toHaveBeenCalledWith("user-1");
    expect(result.current.filter.period).toEqual({
      kind: "day",
      year: 2025,
      month: 3,
      day: 15,
    });
    expect(result.current.filter.genders).toEqual([]);
    expect(result.current.periodTitle).toBe("Leituras de 15 de março de 2025");
  });

  it("desabilita download quando o período filtrado está vazio", async () => {
    getFinishedBooks.mockResolvedValueOnce([
      recapBook({ title: "Outro dia", endDate: "2025-03-14" }),
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

  it("habilita download quando há capas no recap de hoje", async () => {
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
    expect(result.current.images[0]?.coverSrcs).toHaveLength(3);
    expect(result.current.periodTitle).toBe("Leituras de março de 2025");
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

    expect(result.current.filter.genders).toEqual(["romance"]);
    expect(result.current.images[0]?.subtitle).toBe("Romance");
    expect(result.current.images[0]?.coverSrcs).toEqual([
      "https://m.media-amazon.com/images/I/romance.jpg",
    ]);
  });

  it("não busca livros enquanto o modal está fechado", () => {
    renderHook(() => useReadingRecap(false), {
      wrapper: createWrapper(),
    });

    expect(getFinishedBooks).not.toHaveBeenCalled();
  });

  it("ao reabrir o modal volta ao dia de hoje e descarta o filtro", async () => {
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
      result.current.handlePeriodKindChange("year");
      result.current.handleToggleGender("romance");
    });

    expect(result.current.filter.period.kind).toBe("year");
    expect(result.current.filter.genders).toEqual(["romance"]);

    rerender({ isOpen: false });
    rerender({ isOpen: true });

    await waitFor(() => {
      expect(result.current.filter.period).toEqual({
        kind: "day",
        year: 2025,
        month: 3,
        day: 15,
      });
    });
    expect(result.current.filter.genders).toEqual([]);
  });
});
