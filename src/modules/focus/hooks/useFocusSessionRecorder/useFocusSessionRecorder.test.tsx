import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockEdit, mockInvalidate, mockSuccess, mockError } = vi.hoisted(() => ({
  mockEdit: vi.fn(),
  mockInvalidate: vi.fn(),
  mockSuccess: vi.fn(),
  mockError: vi.fn(),
}));

vi.mock("@/modules/bookUpsert/services/bookUpsert.service", () => ({
  BookUpsertService: class {
    edit = mockEdit;
  },
}));

vi.mock("sonner", () => ({
  toast: { success: mockSuccess, error: mockError },
}));

import type { FocusBook, FocusSession } from "../../types/focus.types";
import { useFocusSessionRecorder } from "./useFocusSessionRecorder";

const book: FocusBook = {
  id: "book-1",
  title: "O nome do vento",
  author: "Patrick Rothfuss",
  authorIds: ["author-1"],
  imageUrl: "https://example.com/capa.jpg",
  pages: 200,
  currentPage: 180,
  readerIds: ["user-1"],
  chosenBy: "user-1",
  userId: "user-1",
  startDate: "2026-01-01",
  gender: "Fantasia",
  isReread: false,
  status: "reading",
};

const sessions: FocusSession[] = [];

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  client.invalidateQueries = mockInvalidate;

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useFocusSessionRecorder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEdit.mockResolvedValue(undefined);
    mockInvalidate.mockResolvedValue(undefined);
  });

  it("sugere página atual mais páginas pretendidas", async () => {
    const { result } = renderHook(
      () =>
        useFocusSessionRecorder({
          sessions,
          addSession: vi.fn(),
          savePage: vi.fn(),
        }),
      { wrapper },
    );

    act(() => {
      result.current.openSummary({
        startedAt: "2026-01-01T12:00:00Z",
        finishedAt: "2026-01-01T12:25:00Z",
        durationSeconds: 1500,
        mode: "timer",
        book,
        goalPages: 10,
        estimatedPages: 25,
      });
    });

    expect(result.current.suggestedPage).toBe(190);
  });

  it("registra a sessão e a página final sem concluir o livro", async () => {
    const addSession = vi.fn();
    const savePage = vi.fn();
    const { result } = renderHook(
      () =>
        useFocusSessionRecorder({ sessions, addSession, savePage }),
      { wrapper },
    );

    act(() => {
      result.current.openSummary({
        startedAt: "2026-01-01T12:00:00Z",
        finishedAt: "2026-01-01T12:25:00Z",
        durationSeconds: 1500,
        mode: "timer",
        book,
        goalPages: 10,
        estimatedPages: 25,
      });
    });

    await act(async () => {
      await result.current.confirmSummary(190);
    });

    expect(addSession).toHaveBeenCalledWith(
      expect.objectContaining({
        bookId: "book-1",
        goalPages: 10,
        pagesRead: 10,
        finishedPage: 190,
      }),
    );
    expect(savePage).toHaveBeenCalledWith("book-1", 190);
    expect(mockEdit).not.toHaveBeenCalled();
    expect(result.current.summary).toBeNull();
  });

  it("aplica a regra de conclusão na última página", async () => {
    const { result } = renderHook(
      () =>
        useFocusSessionRecorder({
          sessions,
          addSession: vi.fn(),
          savePage: vi.fn(),
        }),
      { wrapper },
    );

    act(() => {
      result.current.openSummary({
        startedAt: "2026-01-01T12:00:00Z",
        finishedAt: "2026-01-01T12:25:00Z",
        durationSeconds: 1500,
        mode: "stopwatch",
        book,
        goalPages: 10,
        estimatedPages: 25,
      });
    });

    await act(async () => {
      await result.current.confirmSummary(200);
    });

    await waitFor(() => expect(mockEdit).toHaveBeenCalledTimes(1));

    expect(mockEdit).toHaveBeenCalledWith(
      "book-1",
      expect.objectContaining({ status: "finished" }),
    );
    expect(mockSuccess).toHaveBeenCalledTimes(1);
  });
});
