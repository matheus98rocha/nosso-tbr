import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetAll, mockEdit } = vi.hoisted(() => ({
  mockGetAll: vi.fn(),
  mockEdit: vi.fn(),
}));

vi.mock("@/services/books/books.service", () => ({
  BookService: class {
    getAll = mockGetAll;
  },
}));

vi.mock("@/modules/bookUpsert/services/bookUpsert.service", () => ({
  BookUpsertService: class {
    edit = mockEdit;
  },
}));

vi.mock("@/stores/userStore", () => ({
  useUserStore: (selector: (state: { user: { id: string } | null }) => unknown) =>
    selector({ user: { id: "user-1" } }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { useFocusScreen } from "./useFocusScreen";

const book = {
  id: "book-1",
  title: "O nome do vento",
  author: "Patrick Rothfuss",
  authorIds: ["author-1"],
  image_url: "https://example.com/capa.jpg",
  pages: 200,
  status: "reading",
  readerIds: ["user-1"],
  authorId: "author-1",
  chosen_by: "user-1",
  user_id: "user-1",
  start_date: "2026-01-01",
  planned_start_date: null,
  end_date: null,
  gender: "Fantasia",
  is_reread: false,
  reading_rating_stars: null,
  is_favorite: false,
};

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useFocusScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    mockGetAll.mockResolvedValue({ data: [book], total: 1 });
    mockEdit.mockResolvedValue(undefined);
  });

  it("carrega livros em leitura e calcula a velocidade padrão", async () => {
    const { result } = renderHook(() => useFocusScreen(), { wrapper });

    await waitFor(() => expect(result.current.books).toHaveLength(1));

    expect(result.current.books[0]).toMatchObject({
      id: "book-1",
      currentPage: 1,
      pages: 200,
    });
    expect(result.current.speed).toBe(1);
  });

  it("hidrata livro, meta e mudo de uma sessão persistida", async () => {
    window.localStorage.setItem(
      "nosso-tbr:focus:active:user-1",
      JSON.stringify({
        mode: "timer",
        status: "paused",
        startedAt: null,
        endsAt: null,
        accumulatedSeconds: 42,
        durationSeconds: 1500,
        selectedBookId: "book-1",
        goalPages: 10,
        muted: true,
        updatedAt: new Date().toISOString(),
      }),
    );

    const { result } = renderHook(() => useFocusScreen(), { wrapper });

    await waitFor(() => expect(result.current.book?.id).toBe("book-1"));

    expect(result.current.goalPages).toBe(10);
    expect(result.current.goalInput).toBe("10");
    expect(result.current.muted).toBe(true);
  });

  it("sugere o tempo a partir das páginas informadas e aceita a sugestão", async () => {
    const { result } = renderHook(() => useFocusScreen(), { wrapper });

    await waitFor(() => expect(result.current.books).toHaveLength(1));

    act(() => {
      result.current.onGoalInputChange("20");
    });
    act(() => {
      result.current.onGoalSubmit();
    });

    await waitFor(() => expect(result.current.suggestedMinutes).toBe(20));

    act(() => {
      result.current.onAcceptSuggestion();
    });

    expect(result.current.durationMinutes).toBe(20);
  });

  it("deriva a meta e sugere o tempo a partir da página atual e da pretendida", async () => {
    const { result } = renderHook(() => useFocusScreen(), { wrapper });

    await waitFor(() => expect(result.current.books).toHaveLength(1));

    act(() => {
      result.current.onBookChange("book-1");
    });
    act(() => {
      result.current.onCurrentPageChange("30");
    });
    act(() => {
      result.current.onTargetPageChange("50");
    });

    await waitFor(() => expect(result.current.goalPages).toBe(20));

    expect(result.current.targetPage).toBe(50);
    expect(result.current.suggestedMinutes).toBe(20);
    expect(window.localStorage.getItem("nosso-tbr:focus:pages:user-1")).toBe(
      JSON.stringify({ "book-1": 30 }),
    );

    act(() => {
      result.current.onTargetPageChange("25");
    });

    expect(result.current.targetPage).toBeNull();
    expect(result.current.pageRangeError).toContain("entre 31 e 200");
  });

  it("hidrata a página pretendida de uma sessão persistida", async () => {
    window.localStorage.setItem("nosso-tbr:focus:pages:user-1", "{\"book-1\":30}");
    window.localStorage.setItem(
      "nosso-tbr:focus:active:user-1",
      JSON.stringify({
        mode: "timer",
        status: "paused",
        startedAt: null,
        endsAt: null,
        accumulatedSeconds: 42,
        durationSeconds: 1500,
        selectedBookId: "book-1",
        goalPages: 20,
        targetPage: 50,
        muted: false,
        updatedAt: new Date().toISOString(),
      }),
    );

    const { result } = renderHook(() => useFocusScreen(), { wrapper });

    await waitFor(() => expect(result.current.book?.currentPage).toBe(30));

    expect(result.current.targetPage).toBe(50);
    expect(result.current.targetPageInput).toBe("50");
    expect(result.current.currentPageInput).toBe("30");
  });

  it("alterna o modo de contagem e o mudo", async () => {
    const { result } = renderHook(() => useFocusScreen(), { wrapper });

    await waitFor(() => expect(result.current.booksLoading).toBe(false));

    act(() => {
      result.current.onModeChange("stopwatch");
    });
    act(() => {
      result.current.onToggleMute();
    });

    expect(result.current.mode).toBe("stopwatch");
    expect(result.current.muted).toBe(true);
  });

  it("aceita preenchimento rápido de páginas dentro do limite do livro", async () => {
    const { result } = renderHook(() => useFocusScreen(), { wrapper });

    await waitFor(() => expect(result.current.books).toHaveLength(1));

    act(() => {
      result.current.onBookChange("book-1");
    });
    act(() => {
      result.current.onGoalPreset(10);
    });

    expect(result.current.goalPages).toBe(10);
  });
});
