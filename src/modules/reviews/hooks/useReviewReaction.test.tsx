import { QueryClient, QueryClientProvider, type InfiniteData } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUserStore } from "@/stores/userStore";
import type { User } from "@/types/user.types";

import { REVIEWS_COPY } from "../constants";
import type { ReviewFeedItem, ReviewFeedPage } from "../types";
import { reviewQueryKeys } from "../utils";
import { useReviewReaction } from "./useReviewReaction";

const { setReaction } = vi.hoisted(() => ({
  setReaction: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}));

vi.mock("../services", () => ({
  ReviewsService: class {
    setReaction = setReaction;
  },
}));

const alice = { id: "alice" } as User;
const bob = { id: "bob" } as User;

function review(
  overrides: Partial<ReviewFeedItem> & Pick<ReviewFeedItem, "id" | "userId" | "content">,
): ReviewFeedItem {
  return {
    authorDisplayName: "Leitor",
    authorAvatarSeed: null,
    bookId: "book-1",
    bookTitle: "Diário",
    bookImageUrl: null,
    bookAuthors: "",
    bookIsSolo: true,
    stars: 5,
    readingStatus: "finished",
    createdAt: "2026-11-18T00:00:00.000Z",
    updatedAt: "2026-11-18T00:00:00.000Z",
    edited: false,
    likeCount: 1,
    dislikeCount: 0,
    commentCount: 0,
    userReaction: null,
    isOwn: false,
    ...overrides,
  };
}

function feed(item: ReviewFeedItem): InfiniteData<ReviewFeedPage> {
  return {
    pages: [{ reviews: [item], nextCursor: null }],
    pageParams: [null],
  };
}

function renderReaction(queryClient: QueryClient) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useReviewReaction("all"), { wrapper });
}

function createClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

describe("useReviewReaction", () => {
  beforeEach(() => {
    setReaction.mockReset();
    useUserStore.setState({ user: null });
  });

  it("não reage com o card que está só no cache de outra conta", () => {
    const queryClient = createClient();
    const bobFeed = feed(
      review({ id: "review-bob", userId: "bob", content: "Texto do Bob", likeCount: 4 }),
    );
    queryClient.setQueryData(reviewQueryKeys.feed(bob.id, "all"), bobFeed);
    useUserStore.setState({ user: alice });

    const { result } = renderReaction(queryClient);

    act(() => {
      result.current.react("review-bob", "like");
    });

    expect(setReaction).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(reviewQueryKeys.feed(bob.id, "all"))).toEqual(bobFeed);
    expect(queryClient.getQueryData(reviewQueryKeys.feed(alice.id, "all"))).toBeUndefined();
  });

  it("devolve a página de quem reagiu quando a conta muda antes do erro", async () => {
    let rejectReaction: (reason: Error) => void = () => {};
    setReaction.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectReaction = reject;
        }),
    );

    const queryClient = createClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const carolReview = review({
      id: "review-carol",
      userId: "carol",
      content: "Texto da Carol",
      likeCount: 1,
    });
    const bobReview = review({
      id: "review-bob",
      userId: "bob",
      content: "Texto do Bob",
      likeCount: 4,
    });
    const aliceFeed = feed(carolReview);
    const bobFeed = feed(bobReview);
    const aliceKey = reviewQueryKeys.feed(alice.id, "all");
    const bobKey = reviewQueryKeys.feed(bob.id, "all");
    queryClient.setQueryData(aliceKey, aliceFeed);
    queryClient.setQueryData(bobKey, bobFeed);
    useUserStore.setState({ user: alice });

    const { result } = renderReaction(queryClient);

    act(() => {
      result.current.react("review-carol", "like");
    });

    await waitFor(() => {
      const current = queryClient.getQueryData<InfiniteData<ReviewFeedPage>>(aliceKey);
      expect(current?.pages[0]?.reviews[0]?.likeCount).toBe(2);
      expect(current?.pages[0]?.reviews[0]?.userReaction).toBe("like");
    });
    expect(queryClient.getQueryData(bobKey)).toEqual(bobFeed);
    expect(setReaction).toHaveBeenCalledTimes(1);
    expect(setReaction).toHaveBeenCalledWith("review-carol", "like");

    act(() => {
      useUserStore.setState({ user: bob });
    });

    await act(async () => {
      rejectReaction(new Error("falha"));
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(REVIEWS_COPY.reactionError, {
        className: "toast-error",
      });
    });

    expect(queryClient.getQueryData(aliceKey)).toEqual(aliceFeed);
    expect(queryClient.getQueryData(bobKey)).toEqual(bobFeed);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: aliceKey });
    expect(invalidate.mock.calls).not.toContainEqual([{ queryKey: bobKey }]);
  });
});
