import { QueryClient, QueryClientProvider, type InfiniteData } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

function renderReaction(item: ReviewFeedItem) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  client.setQueryData<InfiniteData<ReviewFeedPage>>(reviewQueryKeys.feed("all"), {
    pages: [{ reviews: [item], nextCursor: null }],
    pageParams: [null],
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  const hook = renderHook(() => useReviewReaction("all"), { wrapper });
  const stored = () =>
    client.getQueryData<InfiniteData<ReviewFeedPage>>(reviewQueryKeys.feed("all"))
      ?.pages[0]?.reviews[0];
  return { ...hook, stored };
}

describe("useReviewReaction", () => {
  beforeEach(() => {
    setReaction.mockReset();
    toastError.mockReset();
  });

  it("não reage à própria resenha nem a um card que não está no feed", () => {
    const own = renderReaction(feedItem({ isOwn: true, likeCount: 3 }));
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
