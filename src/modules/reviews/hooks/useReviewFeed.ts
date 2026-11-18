"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useUserStore } from "@/stores/userStore";

import { REVIEW_PAGE_SIZE } from "../constants";
import { ReviewsService } from "../services";
import type { ReviewCursor, ReviewScope } from "../types";
import { reviewQueryKeys } from "../utils";

const service = new ReviewsService();

export function useReviewFeed(scope: ReviewScope) {
  const viewerUserId = useUserStore((state) => state.user?.id ?? null);

  const query = useInfiniteQuery({
    queryKey: reviewQueryKeys.feed(scope),
    initialPageParam: null as ReviewCursor | null,
    queryFn: ({ pageParam }) =>
      service.listFeed(scope, pageParam, viewerUserId, REVIEW_PAGE_SIZE),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const reviews = useMemo(
    () =>
      (query.data?.pages.flatMap((page) => page.reviews) ?? []).map((review) => ({
        ...review,
        isOwn: viewerUserId !== null && review.userId === viewerUserId,
      })),
    [query.data, viewerUserId],
  );

  return {
    reviews,
    isLoading: query.isLoading,
    isError: query.isError,
    hasNextPage: Boolean(query.hasNextPage),
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}
