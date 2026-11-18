import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUserStore } from "@/stores/userStore";
import type { User } from "@/types/user.types";

import { REVIEWS_COPY } from "../constants";
import type { ReviewFeedItem, ReviewFeedPage } from "../types";
import { reviewQueryKeys } from "../utils";
import { useReviewReaction } from "./useReviewReaction";

const { setReactionMock, toastError } = vi.hoisted(() => ({
  setReactionMock: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: toastError },
}));

vi.mock("../services", () => ({
  ReviewsService: class {
    setReaction(reviewId: unknown, reaction: unknown) {
      return setReactionMock(reviewId, reaction);
    }
  },
}));

const VIEWER_ID = "viewer-1";
const OTHER_ID = "author-2";

function review(patch: Partial<ReviewFeedItem>): ReviewFeedItem {
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
    content: "Bom",
    readingStatus: "reading",
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-01T00:00:00.000Z",
    edited: false,
    likeCount: 2,
    dislikeCount: 1,
    commentCount: 0,
    userReaction: null,
    isOwn: false,
    ...patch,
  };
}

function renderReaction(items: ReviewFeedItem[], userId: string | null) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const page: ReviewFeedPage = { reviews: items, nextCursor: null };
  client.setQueryData(reviewQueryKeys.feed("all"), {
    pages: [page],
    pageParams: [null],
  });
  useUserStore.setState({ user: userId ? ({ id: userId } as User) : null });

  const hook = renderHook(() => useReviewReaction("all"), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });

  return { ...hook, client };
}

function stored(client: QueryClient) {
  const data = client.getQueryData<{ pages: ReviewFeedPage[] }>(
    reviewQueryKeys.feed("all"),
  );
  return data?.pages[0]?.reviews ?? [];
}

describe("useReviewReaction", () => {
  beforeEach(() => {
    setReactionMock.mockReset();
    toastError.mockReset();
    setReactionMock.mockResolvedValue({ ok: true });
    useUserStore.setState({ user: null });
  });

  it("não reage na própria resenha nem sem sessão, mesmo com isOwn atrasado", async () => {
    const own = review({ id: "mine", userId: VIEWER_ID, isOwn: false });
    const other = review({ id: "theirs", userId: OTHER_ID, isOwn: true });
    const asOwner = renderReaction([own, other], VIEWER_ID);

    act(() => {
      asOwner.result.current.react("mine", "like");
    });
    asOwner.unmount();

    const signedOut = renderReaction([other], null);
    act(() => {
      signedOut.result.current.react("theirs", "like");
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(setReactionMock).not.toHaveBeenCalled();
  });

  it("reage uma vez na resenha de outra pessoa e desfaz a contagem se falhar", async () => {
    const other = review({
      id: "theirs",
      userId: OTHER_ID,
      isOwn: true,
      bookIsSolo: true,
    });
    let release: (() => void) | undefined;
    setReactionMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () => resolve({ ok: true });
        }),
    );
    const pending = renderReaction([other], VIEWER_ID);

    act(() => {
      pending.result.current.react("theirs", "like");
      pending.result.current.react("theirs", "dislike");
    });

    await waitFor(() => {
      expect(setReactionMock).toHaveBeenCalledTimes(1);
    });
    expect(setReactionMock).toHaveBeenCalledWith("theirs", "like");
    expect(stored(pending.client)[0]).toMatchObject({
      userReaction: "like",
      likeCount: 3,
      dislikeCount: 1,
      bookIsSolo: true,
    });

    await act(async () => {
      release?.();
    });
    pending.unmount();

    setReactionMock.mockRejectedValue(new Error("falha"));
    const failing = renderReaction(
      [review({ id: "theirs", userId: OTHER_ID, isOwn: false, likeCount: 2 })],
      VIEWER_ID,
    );

    act(() => {
      failing.result.current.react("theirs", "like");
    });

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(REVIEWS_COPY.reactionError, {
        className: "toast-error",
      });
    });
    expect(stored(failing.client)[0]).toMatchObject({
      userReaction: null,
      likeCount: 2,
      bookIsSolo: true,
    });
  });
});
