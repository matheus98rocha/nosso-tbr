import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUserStore } from "@/stores/userStore";
import type { User } from "@/types/user.types";

import { REVIEWS_COPY } from "../constants";
import type { ReviewComment } from "../types";
import { useReviewComments } from "./useReviewComments";

const { listCommentsMock, createCommentMock, deleteCommentMock, toastError } = vi.hoisted(
  () => ({
    listCommentsMock: vi.fn(),
    createCommentMock: vi.fn(),
    deleteCommentMock: vi.fn(),
    toastError: vi.fn(),
  }),
);

vi.mock("sonner", () => ({
  toast: { error: toastError },
}));

vi.mock("../services", () => ({
  ReviewsService: class {
    listComments(reviewId: string) {
      return listCommentsMock(reviewId);
    }

    createComment(input: unknown) {
      return createCommentMock(input);
    }

    deleteComment(commentId: string) {
      return deleteCommentMock(commentId);
    }
  },
}));

const REVIEW_ID = "review-1";
const VIEWER_ID = "viewer-1";

function comment(patch: Partial<ReviewComment>): ReviewComment {
  return {
    id: "comment-1",
    reviewId: REVIEW_ID,
    userId: "author-1",
    parentId: null,
    content: "Oi",
    createdAt: "2026-11-01T00:00:00.000Z",
    authorDisplayName: "Ana",
    authorAvatarSeed: null,
    ...patch,
  };
}

function renderComments(reviewId: string | null) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const hook = renderHook(() => useReviewComments(reviewId), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  return { ...hook, client };
}

describe("useReviewComments", () => {
  beforeEach(() => {
    listCommentsMock.mockReset();
    createCommentMock.mockReset();
    deleteCommentMock.mockReset();
    toastError.mockReset();
    listCommentsMock.mockResolvedValue([]);
    useUserStore.setState({ user: { id: VIEWER_ID } as User });
  });

  it("tira a raiz e as respostas e devolve a conversa se a exclusão falhar", async () => {
    const sibling = comment({ id: "sibling", content: "outro" });
    const root = comment({ id: "root", content: "raiz" });
    const reply = comment({ id: "reply", parentId: "root", content: "resposta" });
    const siblingReply = comment({
      id: "sibling-reply",
      parentId: "sibling",
      content: "segue",
    });
    listCommentsMock.mockResolvedValue([sibling, root, reply, siblingReply]);
    const { result } = renderComments(REVIEW_ID);

    await waitFor(() => {
      expect(result.current.comments).toHaveLength(4);
    });

    let rejectDelete: (error: Error) => void = () => {};
    deleteCommentMock.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectDelete = reject;
        }),
    );

    let pending: Promise<unknown> = Promise.resolve();
    act(() => {
      pending = result.current.remove("root");
    });

    await waitFor(() => {
      expect(result.current.comments.map((item) => item.id)).toEqual([
        "sibling",
        "sibling-reply",
      ]);
    });

    await act(async () => {
      rejectDelete(new Error("falha"));
      await expect(pending).rejects.toThrow("falha");
    });

    await waitFor(() => {
      expect(result.current.comments.map((item) => item.id)).toEqual([
        "sibling",
        "root",
        "reply",
        "sibling-reply",
      ]);
    });
    expect(toastError).toHaveBeenCalledWith(REVIEWS_COPY.deleteError, {
      className: "toast-error",
    });
  });

  it("não publica texto vazio e envia o comentário principal na resposta", async () => {
    listCommentsMock.mockResolvedValue([comment({ id: "root" })]);
    createCommentMock.mockResolvedValue({
      id: "saved",
      review_id: REVIEW_ID,
      user_id: VIEWER_ID,
      parent_id: "root",
      content: "concordo",
      created_at: "2026-11-18T00:00:00.000Z",
      users: { display_name: "Você", avatar_seed: null },
    });
    const { result } = renderComments(REVIEW_ID);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.publish("   ");
    });
    expect(createCommentMock).not.toHaveBeenCalled();

    await act(async () => {
      result.current.setReplyTo({ parentId: "root", name: "Ana" });
    });
    await waitFor(() => {
      expect(result.current.replyTo).toEqual({ parentId: "root", name: "Ana" });
    });

    await act(async () => {
      result.current.publish("  concordo  ");
    });

    await waitFor(() => {
      expect(createCommentMock).toHaveBeenCalledWith({
        reviewId: REVIEW_ID,
        content: "concordo",
        parentId: "root",
      });
    });
  });

  it("mostra o comentário na hora e desfaz se a publicação falhar", async () => {
    const saved = comment({ id: "root" });
    listCommentsMock.mockResolvedValue([saved]);
    const { result } = renderComments(REVIEW_ID);

    await waitFor(() => {
      expect(result.current.comments).toEqual([saved]);
    });

    let rejectCreate: (error: Error) => void = () => {};
    createCommentMock.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectCreate = reject;
        }),
    );

    act(() => {
      result.current.publish("oi");
    });

    await waitFor(() => {
      expect(result.current.comments).toEqual([
        saved,
        expect.objectContaining({
          content: "oi",
          authorDisplayName: "Você",
          pending: true,
          parentId: null,
        }),
      ]);
    });

    await act(async () => {
      rejectCreate(new Error("falha"));
    });

    await waitFor(() => {
      expect(result.current.comments).toEqual([saved]);
    });
    expect(toastError).toHaveBeenCalledWith(REVIEWS_COPY.commentError, {
      className: "toast-error",
    });
  });

  it("não lista nem publica sem resenha", async () => {
    const { result } = renderComments(null);

    act(() => {
      result.current.publish("oi");
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(listCommentsMock).not.toHaveBeenCalled();
    expect(createCommentMock).not.toHaveBeenCalled();
  });
});
