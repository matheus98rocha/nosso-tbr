import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetMany, mockUseUserStore, mockUseIsLoggedIn } = vi.hoisted(() => ({
  mockGetMany: vi.fn(),
  mockUseUserStore: vi.fn(),
  mockUseIsLoggedIn: vi.fn(),
}));

vi.mock("@/modules/schedule/services/readingProgress.service", () => ({
  ReadingProgressService: class {
    getMany = mockGetMany;
  },
}));

vi.mock("@/stores/userStore", () => ({
  useUserStore: (selector: (state: { user?: { id?: string } }) => unknown) =>
    mockUseUserStore(selector),
}));

vi.mock("@/stores/hooks/useAuth", () => ({
  useIsLoggedIn: () => mockUseIsLoggedIn(),
}));

import { useReadingProgressMany } from "./useReadingProgressMany";

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return { queryClient, wrapper };
}

describe("useReadingProgressMany", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUserStore.mockImplementation((selector) =>
      selector({ user: { id: "user-1" } }),
    );
    mockUseIsLoggedIn.mockReturnValue(true);
  });

  it("não dispara fetch quando o usuário não está logado", () => {
    mockUseIsLoggedIn.mockReturnValue(false);
    const { wrapper } = makeWrapper();
    renderHook(() => useReadingProgressMany(["a", "b"]), { wrapper });
    expect(mockGetMany).not.toHaveBeenCalled();
  });

  it("não dispara fetch quando bookIds está vazio", () => {
    const { wrapper } = makeWrapper();
    renderHook(() => useReadingProgressMany([]), { wrapper });
    expect(mockGetMany).not.toHaveBeenCalled();
  });

  it("dispara fetch ordenando os bookIds para garantir cache key estável", async () => {
    mockGetMany.mockResolvedValueOnce([]);
    const { wrapper } = makeWrapper();
    renderHook(() => useReadingProgressMany(["b", "a", "c"]), { wrapper });

    await waitFor(() => {
      expect(mockGetMany).toHaveBeenCalledTimes(1);
      expect(mockGetMany).toHaveBeenCalledWith(["a", "b", "c"]);
    });
  });

  it("transforma o payload de persistência em mapa por bookId", async () => {
    mockGetMany.mockResolvedValueOnce([
      { book_id: "a", total: 10, completed: 4 },
      { book_id: "b", total: 5, completed: 5 },
    ]);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useReadingProgressMany(["a", "b"]),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.progressByBookId.size).toBe(2);
    });

    expect(result.current.progressByBookId.get("a")).toEqual({
      bookId: "a",
      total: 10,
      completed: 4,
      percentage: 40,
    });
    expect(result.current.progressByBookId.get("b")).toEqual({
      bookId: "b",
      total: 5,
      completed: 5,
      percentage: 100,
    });
    expect(result.current.paceByBookId.size).toBe(0);
  });

  it("mapeia overdue, ahead e last_date para paceByBookId", async () => {
    mockGetMany.mockResolvedValueOnce([
      {
        book_id: "a",
        total: 10,
        completed: 6,
        overdue: 0,
        ahead: 1,
        last_date: "2026-08-10",
      },
    ]);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useReadingProgressMany(["a"]), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.paceByBookId.size).toBe(1);
    });

    const pace = result.current.paceByBookId.get("a");
    expect(pace?.status).toBe("ahead");
    expect(pace?.aheadDays).toBe(1);
    expect(pace?.overdueDays).toBe(0);
    expect(pace?.predictedEndDate.getFullYear()).toBe(2026);
    expect(pace?.predictedEndDate.getMonth()).toBe(7);
    expect(pace?.predictedEndDate.getDate()).toBe(9);
  });

  it("mapeia overdue para status behind", async () => {
    mockGetMany.mockResolvedValueOnce([
      {
        book_id: "a",
        total: 10,
        completed: 3,
        overdue: 2,
        ahead: 0,
        last_date: "2026-08-10",
      },
    ]);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useReadingProgressMany(["a"]), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.paceByBookId.get("a")?.status).toBe("behind");
    });
    expect(result.current.paceByBookId.get("a")?.overdueDays).toBe(2);
    expect(result.current.paceByBookId.get("a")?.predictedEndDate.getDate()).toBe(
      12,
    );
  });

  it("omite entradas com total inválido (RNxx-03)", async () => {
    mockGetMany.mockResolvedValueOnce([
      { book_id: "a", total: 0, completed: 0 },
      { book_id: "b", total: 3, completed: 1 },
    ]);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useReadingProgressMany(["a", "b"]),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.progressByBookId.size).toBe(1);
    });
    expect(result.current.progressByBookId.has("a")).toBe(false);
    expect(result.current.progressByBookId.has("b")).toBe(true);
  });
});
