import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUserStore } from "@/stores/userStore";
import type { User } from "@/types/user.types";

import { REVIEWS_COPY } from "../constants";
import type { ReviewComment } from "../types";
import { useReviewComments } from "./useReviewComments";

const REVIEW_ID = "550e8400-e29b-41d4-a716-446655440010";
const VIEWER_ID = "660e8400-e29b-41d4-a716-446655440002";

const { listComments, createComment, deleteComment, toastError } = vi.hoisted(() => ({
  listComments: vi.fn(),
  createComment: vi.fn(),
  deleteComment: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("../services", () => ({
  ReviewsService: vi.fn(function (this: {
    listComments: typeof listComments;
    createComment: typeof createComment;
    deleteComment: typeof deleteComment;
  }) {
    this.listComments = listComments;
    this.createComment = createComment;
    this.deleteComment = deleteComment;
  }),
}));

vi.mock("sonner", () => ({
  toast: { error: toastError },
}));

const root: ReviewComment = {
  id: "root",
  reviewId: REVIEW_ID,
  userId: "770e8400-e29b-41d4-a716-446655440003",
  parentId: null,
  content: "Raiz",
  createdAt: "2026-11-01T00:00:00.000Z",
  authorDisplayName: "Ana",
  authorAvatarSeed: null,
};

const reply: ReviewComment = {
  ...root,
  id: "reply",
  parentId: "root",
  content: "Resposta",
};

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useReviewComments", () => {
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, refetchOnWindowFocus: false },
        mutations: { retry: false },
      },
    });
    listComments.mockReset();
    createComment.mockReset();
    deleteComment.mockReset();
    toastError.mockReset();
    listComments.mockResolvedValue([root, reply]);
    createComment.mockResolvedValue({
      id: "saved",
      review_id: REVIEW_ID,
      user_id: VIEWER_ID,
      parent_id: "root",
      content: "concordo",
      created_at: "2026-11-02T00:00:00.000Z",
      users: { display_name: "Ana", avatar_seed: null },
    });
    useUserStore.setState({
      user: { id: VIEWER_ID } as User,
      sessionReady: true,
    });
  });

  it("tira as respostas junto com o comentário e devolve as duas se a exclusão falha", async () => {
    let rejectDelete: (error: Error) => void = () => undefined;
    deleteComment.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectDelete = reject;
        }),
    );
    const { result } = renderHook(() => useReviewComments(REVIEW_ID), { wrapper });

    await waitFor(() => expect(result.current.comments.map((item) => item.id)).toEqual(["root", "reply"]));

    act(() => {
      void result.current.remove("root").catch(() => undefined);
    });

    await waitFor(() => expect(result.current.comments).toEqual([]));

    await act(async () => {
      rejectDelete(new Error("down"));
    });

    await waitFor(() =>
      expect(result.current.comments.map((item) => item.id)).toEqual(["root", "reply"]),
    );
    expect(toastError).toHaveBeenCalledWith(REVIEWS_COPY.deleteError, {
      className: "toast-error",
    });
    expect(deleteComment).toHaveBeenCalledWith("root");
  });

  it("não publica texto vazio e envia a resposta para o comentário escolhido", async () => {
    const { result } = renderHook(() => useReviewComments(REVIEW_ID), { wrapper });
    await waitFor(() => expect(result.current.comments).toHaveLength(2));

    act(() => {
      result.current.publish("   ");
    });
    expect(createComment).not.toHaveBeenCalled();

    act(() => {
      result.current.setReplyTo({ parentId: "root", name: "Ana" });
    });
    act(() => {
      result.current.publish("  concordo  ");
    });

    await waitFor(() =>
      expect(createComment).toHaveBeenCalledWith({
        reviewId: REVIEW_ID,
        content: "concordo",
        parentId: "root",
      }),
    );
    expect(result.current.replyTo).toBeNull();
  });

  it("sem resenha aberta não lista nem publica", () => {
    const { result } = renderHook(() => useReviewComments(null), { wrapper });

    act(() => {
      result.current.publish("Oi");
    });

    expect(listComments).not.toHaveBeenCalled();
    expect(createComment).not.toHaveBeenCalled();
    expect(result.current.comments).toEqual([]);
  });
});
