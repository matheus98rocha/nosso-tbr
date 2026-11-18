import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UserProvider } from "@/providers/UserProvider";
import { useUserStore } from "@/stores/userStore";
import type { User } from "@/types/user.types";

import type { ReviewFeedItem } from "../types";
import { useReviewFeed } from "./useReviewFeed";

const listFeed = vi.hoisted(() => vi.fn());

vi.mock("@/modules/reviews/services", () => ({
  ReviewsService: class {
    listFeed = listFeed;
  },
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    },
  }),
}));

const READER_ID = "reader-1";

function reviewBy(userId: string): ReviewFeedItem {
  return {
    id: "review-1",
    userId,
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
    likeCount: 0,
    dislikeCount: 0,
    commentCount: 0,
    userReaction: null,
    isOwn: false,
  };
}

function FeedProbe() {
  const feed = useReviewFeed("all");
  return (
    <div
      data-testid="feed-probe"
      data-loading={String(feed.isLoading)}
      data-own={feed.reviews[0] ? String(feed.reviews[0].isOwn) : ""}
    />
  );
}

function renderFeed(initialUser: User | null) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={client}>
      <UserProvider initialUser={initialUser} initialTier={initialUser ? "common_user" : null}>
        <FeedProbe />
      </UserProvider>
    </QueryClientProvider>,
  );
}

describe("useReviewFeed", () => {
  beforeEach(() => {
    listFeed.mockReset();
    listFeed.mockResolvedValue({
      reviews: [reviewBy(READER_ID)],
      nextCursor: null,
    });
    useUserStore.setState({
      user: null,
      tier: null,
      welcomeTutorialSeenAt: null,
      loading: false,
      error: null,
      isLoggingOut: false,
      sessionReady: false,
    });
  });

  afterEach(() => {
    useUserStore.setState({
      user: null,
      tier: null,
      welcomeTutorialSeenAt: null,
      loading: false,
      error: null,
      isLoggingOut: false,
      sessionReady: false,
    });
  });

  it("espera a sessão do servidor antes de marcar a resenha como sua", async () => {
    const view = renderFeed({ id: READER_ID } as User);

    await waitFor(() => {
      expect(listFeed).toHaveBeenCalledTimes(1);
    });

    expect(listFeed).toHaveBeenCalledWith("all", null, READER_ID, 10);
    await waitFor(() => {
      expect(view.getByTestId("feed-probe").getAttribute("data-own")).toBe("true");
    });
  });

  it("não busca o feed enquanto não há leitor", async () => {
    const view = renderFeed(null);

    await waitFor(() => {
      expect(view.getByTestId("feed-probe").getAttribute("data-loading")).toBe("true");
    });

    expect(listFeed).not.toHaveBeenCalled();
  });
});
