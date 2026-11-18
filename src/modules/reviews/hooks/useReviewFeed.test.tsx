import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUserStore } from "@/stores/userStore";
import type { User } from "@/types/user.types";

import type { ReviewFeedItem } from "../types";
import { reviewQueryKeys } from "../utils";
import { useReviewFeed } from "./useReviewFeed";

const { listFeed } = vi.hoisted(() => ({
  listFeed: vi.fn(),
}));

vi.mock("../services", () => ({
  ReviewsService: class {
    listFeed = listFeed;
  },
}));

const alice = { id: "alice" } as User;
const bob = { id: "bob" } as User;

function privateReview(): ReviewFeedItem {
  return {
    id: "review-alice",
    userId: "alice",
    authorDisplayName: "Alice",
    authorAvatarSeed: null,
    bookId: "book-1",
    bookTitle: "Diário",
    bookImageUrl: null,
    bookAuthors: "",
    bookIsSolo: true,
    stars: 5,
    content: "Segredo da Alice",
    readingStatus: "finished",
    createdAt: "2026-11-18T00:00:00.000Z",
    updatedAt: "2026-11-18T00:00:00.000Z",
    edited: false,
    likeCount: 1,
    dislikeCount: 0,
    commentCount: 0,
    userReaction: "like",
    isOwn: true,
  };
}

function renderFeed(queryClient: QueryClient) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useReviewFeed("all"), { wrapper });
}

describe("useReviewFeed", () => {
  beforeEach(() => {
    listFeed.mockReset();
    listFeed.mockResolvedValue({ reviews: [], nextCursor: null });
    useUserStore.setState({ user: null });
  });

  it("não mostra o feed em cache de outra conta", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 120_000, refetchOnMount: false },
      },
    });
    const aliceFeed = {
      pages: [{ reviews: [privateReview()], nextCursor: null }],
      pageParams: [null],
    };
    queryClient.setQueryData(reviewQueryKeys.feed(alice.id, "all"), aliceFeed);
    useUserStore.setState({ user: bob });

    const { result } = renderFeed(queryClient);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.reviews.map((review) => review.content)).not.toContain(
      "Segredo da Alice",
    );
    expect(queryClient.getQueryData(reviewQueryKeys.feed(alice.id, "all"))).toEqual(aliceFeed);
    expect(queryClient.getQueryData(reviewQueryKeys.feed(bob.id, "all"))).not.toEqual(aliceFeed);
    expect(listFeed).toHaveBeenCalled();
  });
});
