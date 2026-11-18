import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUserStore } from "@/stores/userStore";
import type { User } from "@/types/user.types";

import type { ReviewFeedItem } from "../types";
import { useReviewFeed } from "./useReviewFeed";

const { listFeed } = vi.hoisted(() => ({
  listFeed: vi.fn(),
}));

vi.mock("../services", () => ({
  ReviewsService: class {
    listFeed(...args: unknown[]) {
      return listFeed(...args);
    }
  },
}));

const VIEWER_ID = "viewer-1";
const OTHER_ID = "author-2";

function review(patch: Partial<ReviewFeedItem>): ReviewFeedItem {
  return {
    id: "review-1",
    userId: VIEWER_ID,
    authorDisplayName: "Ana",
    authorAvatarSeed: null,
    bookId: "book-1",
    bookTitle: "O Hobbit",
    bookImageUrl: null,
    bookAuthors: "Tolkien",
    bookIsSolo: true,
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
    isOwn: true,
    ...patch,
  };
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useReviewFeed", () => {
  beforeEach(() => {
    listFeed.mockReset();
    useUserStore.setState({ user: null });
    listFeed.mockResolvedValue({
      reviews: [
        review({ id: "mine", userId: VIEWER_ID, bookIsSolo: true, isOwn: true }),
        review({
          id: "theirs",
          userId: OTHER_ID,
          bookIsSolo: false,
          isOwn: true,
        }),
      ],
      nextCursor: null,
    });
  });

  it("marca a própria resenha quando a sessão chega, sem buscar de novo", async () => {
    const { result } = renderHook(() => useReviewFeed("all"), { wrapper });

    await waitFor(() => {
      expect(result.current.reviews).toHaveLength(2);
    });

    expect(result.current.reviews.map((item) => item.isOwn)).toEqual([false, false]);
    expect(result.current.reviews.map((item) => item.bookIsSolo)).toEqual([true, false]);
    expect(listFeed).toHaveBeenCalledTimes(1);
    expect(listFeed).toHaveBeenCalledWith("all", null, null, 10);

    act(() => {
      useUserStore.setState({ user: { id: VIEWER_ID } as User });
    });

    await waitFor(() => {
      expect(result.current.reviews.map((item) => item.isOwn)).toEqual([true, false]);
    });
    expect(listFeed).toHaveBeenCalledTimes(1);
  });
});
