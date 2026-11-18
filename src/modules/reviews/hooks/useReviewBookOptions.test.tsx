import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUserStore } from "@/stores/userStore";
import type { User } from "@/types/user.types";

import type { ReviewBookOption } from "../types";
import { useReviewBookOptions } from "./useReviewBookOptions";

const USER_ID = "660e8400-e29b-41d4-a716-446655440002";

const { listMyBookIds, listParticipatingBooks } = vi.hoisted(() => ({
  listMyBookIds: vi.fn(),
  listParticipatingBooks: vi.fn(),
}));

vi.mock("../services", () => ({
  ReviewsService: vi.fn(function (this: {
    listMyBookIds: typeof listMyBookIds;
    listParticipatingBooks: typeof listParticipatingBooks;
  }) {
    this.listMyBookIds = listMyBookIds;
    this.listParticipatingBooks = listParticipatingBooks;
  }),
}));

const option: ReviewBookOption = {
  id: "book-1",
  title: "O Hobbit",
  author: "Tolkien",
  imageUrl: null,
  status: "reading",
  isSolo: false,
  hasReview: true,
};

let queryClient: QueryClient;
let resolveIds: (ids: string[]) => void = () => undefined;

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useReviewBookOptions", () => {
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, refetchOnWindowFocus: false, refetchOnReconnect: false },
      },
    });
    listMyBookIds.mockReset();
    listParticipatingBooks.mockReset();
    useUserStore.setState({ user: { id: USER_ID } as User, sessionReady: true });
    listMyBookIds.mockImplementation(
      () =>
        new Promise<string[]>((resolve) => {
          resolveIds = resolve;
        }),
    );
    listParticipatingBooks.mockResolvedValue([option]);
  });

  it("não busca livros antes dos ids já resenhados", async () => {
    const { result } = renderHook(() => useReviewBookOptions(true), { wrapper });

    await waitFor(() => expect(listMyBookIds).toHaveBeenCalledTimes(1));
    expect(listParticipatingBooks).not.toHaveBeenCalled();
    expect(result.current.books).toEqual([]);

    await act(async () => {
      resolveIds(["book-1"]);
    });

    await waitFor(() => expect(listParticipatingBooks).toHaveBeenCalledWith(["book-1"]));
    await waitFor(() => expect(result.current.books).toEqual([option]));
    expect(result.current.isError).toBe(false);
  });

  it("não consulta enquanto o seletor está fechado ou sem sessão", async () => {
    const closed = renderHook(() => useReviewBookOptions(false), { wrapper });
    await act(async () => {
      await Promise.resolve();
    });
    expect(listMyBookIds).not.toHaveBeenCalled();
    closed.unmount();

    useUserStore.setState({ user: null, sessionReady: false });
    renderHook(() => useReviewBookOptions(true), { wrapper });
    await act(async () => {
      await Promise.resolve();
    });
    expect(listMyBookIds).not.toHaveBeenCalled();
  });

  it("não lista livros quando a leitura das resenhas falha", async () => {
    listMyBookIds.mockRejectedValue(new Error("ids down"));
    const { result } = renderHook(() => useReviewBookOptions(true), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(listParticipatingBooks).not.toHaveBeenCalled();
    expect(result.current.books).toEqual([]);
  });
});
