import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockUseUserStore } = vi.hoisted(() => ({
  mockUseUserStore: vi.fn(),
}));

vi.mock("@/stores/userStore", () => ({
  useUserStore: (selector: (state: { user?: { id?: string } }) => unknown) =>
    mockUseUserStore(selector),
}));

import { getReadingProgressManyQueryKey } from "@/modules/schedule/utils/readingProgressQueryKey";
import type { ReadingProgressDomain } from "@/modules/schedule/types/readingProgress.types";
import type { ReadingProgressManyQueryData } from "./useReadingProgressMany";
import { useReadingProgress } from "./useReadingProgress";

function makeWrapper(seedCache?: (qc: QueryClient) => void) {
  const queryClient = new QueryClient();
  seedCache?.(queryClient);
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return { queryClient, wrapper };
}

describe("useReadingProgress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUserStore.mockImplementation((selector) =>
      selector({ user: { id: "user-1" } }),
    );
  });

  it("retorna null quando bookId está ausente", () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useReadingProgress(undefined), { wrapper });
    expect(result.current.progress).toBeNull();
  });

  it("retorna null quando userId não está disponível", () => {
    mockUseUserStore.mockImplementation((selector) =>
      selector({ user: undefined }),
    );
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useReadingProgress("book-1"), { wrapper });
    expect(result.current.progress).toBeNull();
  });

  it("retorna null quando o cache many ainda não foi populado", () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useReadingProgress("book-1"), { wrapper });
    expect(result.current.progress).toBeNull();
  });

  it("encontra o progresso no cache many populado com a key correta", () => {
    const cached: ReadingProgressDomain[] = [
      { bookId: "book-1", total: 10, completed: 4, percentage: 40 },
      { bookId: "book-2", total: 5, completed: 5, percentage: 100 },
    ];
    const { wrapper } = makeWrapper((qc) => {
      qc.setQueryData(
        getReadingProgressManyQueryKey(["book-1", "book-2"], "user-1"),
        cached,
      );
    });

    const { result } = renderHook(() => useReadingProgress("book-1"), { wrapper });
    expect(result.current.progress).toEqual(cached[0]);
  });

  it("ignora caches de outro usuário (RN44)", () => {
    const cached: ReadingProgressDomain[] = [
      { bookId: "book-1", total: 10, completed: 4, percentage: 40 },
    ];
    const { wrapper } = makeWrapper((qc) => {
      qc.setQueryData(
        getReadingProgressManyQueryKey(["book-1"], "outro-usuario"),
        cached,
      );
    });

    const { result } = renderHook(() => useReadingProgress("book-1"), { wrapper });
    expect(result.current.progress).toBeNull();
  });

  it("encontra o progresso no cache many no formato { progress, paceByBookId }", () => {
    const progress: ReadingProgressDomain = {
      bookId: "book-1",
      total: 10,
      completed: 4,
      percentage: 40,
    };
    const cached: ReadingProgressManyQueryData = {
      progress: [progress],
      paceByBookId: new Map(),
    };
    const { wrapper } = makeWrapper((qc) => {
      qc.setQueryData(
        getReadingProgressManyQueryKey(["book-1"], "user-1"),
        cached,
      );
    });

    const { result } = renderHook(() => useReadingProgress("book-1"), {
      wrapper,
    });
    expect(result.current.progress).toEqual(progress);
  });
});
