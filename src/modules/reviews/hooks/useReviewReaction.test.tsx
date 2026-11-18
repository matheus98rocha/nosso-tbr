import { QueryClient, QueryClientProvider, type InfiniteData } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUserStore } from "@/stores/userStore";
import type { User } from "@/types/user.types";

import { REVIEWS_COPY } from "../constants";
import type { ReviewFeedItem, ReviewFeedPage } from "../types";
import { reviewQueryKeys } from "../utils";
import { useReviewReaction } from "./useReviewReaction";

const VIEWER_ID = "660e8400-e29b-41d4-a716-446655440002";
const OTHER_ID = "770e8400-e29b-41d4-a716-446655440003";

const { setReaction, toastError } = vi.hoisted(() => ({
  setReaction: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("../services", () => ({
  ReviewsService: vi.fn(function (this: { setReaction: typeof setReaction }) {
    this.setReaction = setReaction;
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: toastError,
  },
}));

function review(overrides: Partial<ReviewFeedItem>): ReviewFeedItem {
  return {
    id: "review-1",
    userId: OTHER_ID,
    authorDisplayName: "Ana",
    authorAvatarSeed: null,
    bookId: "book-1",
    bookTitle: "O Hobbit",
    bookImageUrl: null,
    bookAuthors: "Tolkien",
    bookIsSolo: true,
    stars: 4,
    content: "Uma viagem redonda.",
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

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function seed(item: ReviewFeedItem) {
  const data: InfiniteData<ReviewFeedPage> = {
    pageParams: [null],
    pages: [{ reviews: [item], nextCursor: null }],
  };
  queryClient.setQueryData(reviewQueryKeys.feed("all"), data);
}

function cachedReview() {
  const data = queryClient.getQueryData<InfiniteData<ReviewFeedPage>>(
    reviewQueryKeys.feed("all"),
  );
  return data?.pages[0]?.reviews[0];
}

describe("useReviewReaction", () => {
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, refetchOnWindowFocus: false },
        mutations: { retry: false },
      },
    });
    setReaction.mockReset();
    toastError.mockReset();
    setReaction.mockResolvedValue(undefined);
    useUserStore.setState({
      user: { id: VIEWER_ID } as User,
      sessionReady: true,
    });
  });

  it("não reage à própria resenha mesmo com a flag de autoria desatualizada", () => {
    seed(review({ userId: VIEWER_ID, isOwn: false }));
    const { result } = renderHook(() => useReviewReaction("all"), { wrapper });

    act(() => {
      result.current.react("review-1", "like");
    });

    expect(setReaction).not.toHaveBeenCalled();
    expect(cachedReview()?.likeCount).toBe(1);
  });

  it("não reage sem sessão, mesmo que o card diga que a resenha é de outra pessoa", () => {
    useUserStore.setState({ user: null, sessionReady: false });
    seed(review({ userId: OTHER_ID, isOwn: false }));
    const { result } = renderHook(() => useReviewReaction("all"), { wrapper });

    act(() => {
      result.current.react("review-1", "like");
    });

    expect(setReaction).not.toHaveBeenCalled();
  });

  it("reage à resenha de outra pessoa mesmo quando a flag de autoria veio verdadeira", async () => {
    let finish: () => void = () => undefined;
    setReaction.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    seed(review({ userId: OTHER_ID, isOwn: true, bookIsSolo: true }));
    const { result } = renderHook(() => useReviewReaction("all"), { wrapper });

    act(() => {
      result.current.react("review-1", "like");
      result.current.react("review-1", "like");
    });

    await waitFor(() => {
      expect(cachedReview()).toMatchObject({
        userReaction: "like",
        likeCount: 2,
        bookIsSolo: true,
      });
    });
    expect(setReaction).toHaveBeenCalledTimes(1);
    expect(setReaction).toHaveBeenCalledWith("review-1", "like");

    await act(async () => {
      finish();
    });
  });

  it("devolve as contagens e avisa quando a reação falha", async () => {
    setReaction.mockRejectedValue(new Error("reaction down"));
    seed(review({ userId: OTHER_ID, isOwn: false, likeCount: 1, userReaction: null }));
    const { result } = renderHook(() => useReviewReaction("all"), { wrapper });

    act(() => {
      result.current.react("review-1", "like");
    });

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(REVIEWS_COPY.reactionError, {
        className: "toast-error",
      });
    });
    expect(cachedReview()).toMatchObject({
      userReaction: null,
      likeCount: 1,
      bookIsSolo: true,
    });
  });
});
