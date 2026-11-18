import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUserStore } from "@/stores/userStore";
import type { User } from "@/types/user.types";

import type { ReviewFeedItem } from "../types";
import { useReviewFeed } from "./useReviewFeed";

const VIEWER_ID = "660e8400-e29b-41d4-a716-446655440002";
const OTHER_ID = "770e8400-e29b-41d4-a716-446655440003";

const { listFeed } = vi.hoisted(() => ({
  listFeed: vi.fn(),
}));

vi.mock("../services", () => ({
  ReviewsService: vi.fn(function (this: { listFeed: typeof listFeed }) {
    this.listFeed = listFeed;
  }),
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
    bookIsSolo: false,
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

describe("useReviewFeed", () => {
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, refetchOnWindowFocus: false, refetchOnReconnect: false },
      },
    });
    listFeed.mockReset();
    useUserStore.setState({ user: null, sessionReady: false });
    listFeed.mockResolvedValue({
      reviews: [
        review({
          id: "mine",
          userId: VIEWER_ID,
          isOwn: false,
          bookIsSolo: true,
        }),
        review({
          id: "theirs",
          userId: OTHER_ID,
          isOwn: true,
          bookIsSolo: false,
        }),
      ],
      nextCursor: null,
    });
  });

  it("marca a própria resenha só depois da sessão e mantém o livro privado", async () => {
    const { result } = renderHook(() => useReviewFeed("all"), { wrapper });

    await waitFor(() => {
      expect(result.current.reviews).toHaveLength(2);
    });

    expect(listFeed).toHaveBeenCalledWith("all", null, null, 10);
    expect(result.current.reviews.map((item) => item.isOwn)).toEqual([false, false]);

    await act(async () => {
      useUserStore.setState({
        user: { id: VIEWER_ID } as User,
        sessionReady: true,
      });
    });

    expect(result.current.reviews.map((item) => [item.id, item.isOwn, item.bookIsSolo])).toEqual([
      ["mine", true, true],
      ["theirs", false, false],
    ]);

    expect(listFeed).toHaveBeenCalledTimes(1);
  });
});
