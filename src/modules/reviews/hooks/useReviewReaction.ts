"use client";

import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import { toast } from "sonner";

import { useUserStore } from "@/stores/userStore";

import { REVIEWS_COPY } from "../constants";
import { ReviewsService } from "../services";
import type { ReviewFeedPage, ReviewReaction, ReviewScope } from "../types";
import { reviewQueryKeys, toggleReviewReaction } from "../utils";

const service = new ReviewsService();

type ReactionInput = {
  reviewId: string;
  next: ReviewReaction | null;
  likeCount: number;
  dislikeCount: number;
};

export function useReviewReaction(scope: ReviewScope) {
  const queryClient = useQueryClient();
  const viewerUserId = useUserStore((state) => state.user?.id ?? null);
  const pendingIds = useRef(new Set<string>());
  const queryKey = reviewQueryKeys.feed(scope, viewerUserId);

  const mutation = useMutation({
    mutationFn: (input: ReactionInput) => service.setReaction(input.reviewId, input.next),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<InfiniteData<ReviewFeedPage>>(queryKey);
      queryClient.setQueryData<InfiniteData<ReviewFeedPage>>(queryKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            reviews: page.reviews.map((item) =>
              item.id === input.reviewId
                ? {
                    ...item,
                    userReaction: input.next,
                    likeCount: input.likeCount,
                    dislikeCount: input.dislikeCount,
                  }
                : item,
            ),
          })),
        };
      });
      return { previous };
    },
    onError: (_error, input, context) => {
      pendingIds.current.delete(input.reviewId);
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(REVIEWS_COPY.reactionError, { className: "toast-error" });
    },
    onSuccess: (_data, input) => {
      pendingIds.current.delete(input.reviewId);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const react = useCallback(
    (reviewId: string, reaction: ReviewReaction) => {
      if (pendingIds.current.has(reviewId)) return;
      const current = queryClient.getQueryData<InfiniteData<ReviewFeedPage>>(queryKey);
      const item = current?.pages
        .flatMap((page) => page.reviews)
        .find((review) => review.id === reviewId);
      if (!item || !viewerUserId || item.userId === viewerUserId) return;

      const next = toggleReviewReaction(item, reaction);
      pendingIds.current.add(reviewId);
      mutation.mutate({
        reviewId,
        next: next.userReaction,
        likeCount: next.likeCount,
        dislikeCount: next.dislikeCount,
      });
    },
    [mutation, queryClient, queryKey, viewerUserId],
  );

  return { react };
}
