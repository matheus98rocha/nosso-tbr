import { QueryClient, QueryClientProvider, type InfiniteData } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUserStore } from "@/stores/userStore";
import type { User } from "@/types/user.types";

import { REVIEWS_COPY } from "../constants";
import type { ReviewFeedItem, ReviewFeedPage } from "../types";
import { reviewQueryKeys } from "../utils";
import { useReviewReaction } from "./useReviewReaction";

const { setReaction, toastError } = vi.hoisted(() => ({
  setReaction: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: toastError },
}));

vi.mock("../services", () => ({
  ReviewsService: class {
    setReaction = setReaction;
  },
}));

function feedItem(overrides: Partial<ReviewFeedItem> = {}): ReviewFeedItem {
  return {
    id: "review-1",
    userId: "author-1",
    authorDisplayName: "Ana",
    authorAvatarSeed: null,
    bookId: "book-1",
    bookTitle: "O Hobbit",
    bookImageUrl: null,
    bookAuthors: "Tolkien",
    bookIsSolo: false,
    stars: 5,
    content: "Bom",
    readingStatus: "finished",
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-01T00:00:00.000Z",
    edited: false,
    likeCount: 1,
    dislikeCount: 0,
    commentCount: 0,
    userReaction: null,
    isOwn: false,
    ...overrides,
  };
}

const VIEWER_ID = "viewer-1";

function renderReaction(item: ReviewFeedItem, viewerUserId = VIEWER_ID) {
  useUserStore.setState({ user: { id: viewerUserId } as User });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const queryKey = reviewQueryKeys.feed("all", viewerUserId);
  client.setQueryData<InfiniteData<ReviewFeedPage>>(queryKey, {
    pages: [{ reviews: [item], nextCursor: null }],
    pageParams: [null],
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  const hook = renderHook(() => useReviewReaction("all"), { wrapper });
  const stored = () =>
    client.getQueryData<InfiniteData<ReviewFeedPage>>(queryKey)?.pages[0]?.reviews[0];
  return { ...hook, stored };
}

describe("useReviewReaction", () => {
  beforeEach(() => {
    setReaction.mockReset();
    toastError.mockReset();
    useUserStore.setState({ user: null });
  });

  it("não reage à própria resenha nem a um card que não está no feed", () => {
    const own = renderReaction(
      feedItem({ userId: VIEWER_ID, isOwn: true, likeCount: 3 }),
      VIEWER_ID,
    );
    act(() => {
      own.result.current.react("review-1", "like");
    });
    expect(setReaction).not.toHaveBeenCalled();
    expect(own.stored()).toMatchObject({ likeCount: 3, userReaction: null });

    const missing = renderReaction(feedItem());
    act(() => {
      missing.result.current.react("review-ausente", "like");
    });
    expect(setReaction).not.toHaveBeenCalled();
  });

  it("atualiza a contagem na hora, ignora o segundo clique e desfaz se a gravação falha", async () => {
    let rejectReaction: (error: Error) => void = () => undefined;
    setReaction.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectReaction = reject;
        }),
    );
    const { result, stored } = renderReaction(
      feedItem({ userReaction: "like", likeCount: 2, dislikeCount: 0 }),
    );

    act(() => {
      result.current.react("review-1", "dislike");
      result.current.react("review-1", "like");
    });

    await waitFor(() => {
      expect(stored()).toMatchObject({
        userReaction: "dislike",
        likeCount: 1,
        dislikeCount: 1,
      });
    });
    expect(setReaction).toHaveBeenCalledTimes(1);
    expect(setReaction).toHaveBeenCalledWith("review-1", "dislike");

    await act(async () => {
      rejectReaction(new Error("fail"));
    });

    await waitFor(() => {
      expect(stored()).toMatchObject({
        userReaction: "like",
        likeCount: 2,
        dislikeCount: 0,
      });
    });
    expect(toastError).toHaveBeenCalledWith(REVIEWS_COPY.reactionError, {
      className: "toast-error",
    });
  });
});
