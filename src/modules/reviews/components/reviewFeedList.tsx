"use client";

import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { REVIEWS_COPY } from "../constants";
import type { ReviewFeedItem, ReviewReaction } from "../types";
import ReviewCard from "./reviewCard";

type ReviewFeedListProps = {
  reviews: ReviewFeedItem[];
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
  onReact: (reviewId: string, reaction: ReviewReaction) => void;
  empty: React.ReactNode;
};

export default function ReviewFeedList({
  reviews,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onRetry,
  onReact,
  empty,
}: ReviewFeedListProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasNextPage || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) onLoadMore();
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, onLoadMore]);

  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError && reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">{REVIEWS_COPY.loadError}</p>
        <Button type="button" className="mt-4" variant="outline" onClick={onRetry}>
          {REVIEWS_COPY.retry}
        </Button>
      </div>
    );
  }

  if (reviews.length === 0) return empty;

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} onReact={onReact} />
      ))}
      {hasNextPage ? (
        <div ref={sentinelRef} className="flex justify-center py-2">
          <Button
            type="button"
            variant="outline"
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? REVIEWS_COPY.loadingMore : REVIEWS_COPY.loadMore}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
