import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUserStore } from "@/stores/userStore";
import type { User } from "@/types/user.types";

import { REVIEWS_COPY } from "../constants";
import type { ReviewComment } from "../types";
import { useReviewComments } from "./useReviewComments";

const { listComments, createComment, deleteComment, toastError } = vi.hoisted(() => ({
  listComments: vi.fn(),
  createComment: vi.fn(),
  deleteComment: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: toastError },
}));

vi.mock("../services", () => ({
  ReviewsService: class {
    listComments = listComments;
    createComment = createComment;
    deleteComment = deleteComment;
  },
}));

function comment(overrides: Partial<ReviewComment>): ReviewComment {
  return {
    id: "c1",
    reviewId: "review-1",
    userId: "author-1",
    parentId: null,
    content: "Raiz",
    createdAt: "2026-11-18T00:00:00.000Z",
    authorDisplayName: "Ana",
    authorAvatarSeed: null,
    ...overrides,
  };
}

function renderComments() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  return renderHook(() => useReviewComments("review-1"), { wrapper });
}

describe("useReviewComments", () => {
  const root = comment({ id: "c1" });
  const reply = comment({ id: "c2", parentId: "c1", content: "Resposta" });
  const other = comment({ id: "c3", content: "Outro" });

  beforeEach(() => {
    listComments.mockReset();
    createComment.mockReset();
    deleteComment.mockReset();
    toastError.mockReset();
    listComments.mockResolvedValue([root, reply, other]);
    useUserStore.setState({ user: { id: "user-1" } as User });
  });

  it("não publica texto vazio", async () => {
    const { result } = renderComments();
    await waitFor(() => expect(result.current.comments).toHaveLength(3));

    act(() => {
      result.current.publish("   ");
    });

    expect(createComment).not.toHaveBeenCalled();
    expect(result.current.comments).toHaveLength(3);
  });

  it("ao excluir o comentário raiz, tira as respostas e restaura se a gravação falha", async () => {
    let rejectDelete: (error: Error) => void = () => undefined;
    deleteComment.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectDelete = reject;
        }),
    );
    const { result } = renderComments();
    await waitFor(() => expect(result.current.comments).toHaveLength(3));

    act(() => {
      void result.current.remove("c1").catch(() => undefined);
    });

    await waitFor(() => {
      expect(result.current.comments.map((item) => item.id)).toEqual(["c3"]);
    });

    await act(async () => {
      rejectDelete(new Error("fail"));
    });

    await waitFor(() => {
      expect(result.current.comments.map((item) => item.id)).toEqual(["c1", "c2", "c3"]);
    });
    expect(toastError).toHaveBeenCalledWith(REVIEWS_COPY.deleteError, {
      className: "toast-error",
    });
  });
});
