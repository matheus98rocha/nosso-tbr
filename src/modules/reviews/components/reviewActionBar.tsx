"use client";

import { MessageCircle, ThumbsDown, ThumbsUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { REVIEWS_COPY } from "../constants";
import type { ReviewFeedItem, ReviewReaction } from "../types";
import { buildReviewIntentUrl, buildReviewTweetText } from "../utils";
import { toast } from "sonner";

type ReviewActionBarProps = {
  review: ReviewFeedItem;
  onReact: (reviewId: string, reaction: ReviewReaction) => void;
  onOpenComments: () => void;
};

export default function ReviewActionBar({
  review,
  onReact,
  onOpenComments,
}: ReviewActionBarProps) {
  const share = () => {
    const text = buildReviewTweetText({
      title: review.bookTitle,
      author: review.bookAuthors || null,
      content: review.content,
      readerName: review.authorDisplayName,
    });
    const popup = window.open(buildReviewIntentUrl(text), "_blank", "noopener,noreferrer");
    if (!popup) {
      toast.error(REVIEWS_COPY.xBlocked, { className: "toast-error" });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-t border-border/70 pt-3">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={review.isOwn}
        aria-pressed={review.userReaction === "like"}
        aria-label={`${REVIEWS_COPY.like}. ${review.likeCount}`}
        onClick={() => onReact(review.id, "like")}
        className={cn(
          "h-9 gap-1.5 rounded-full px-3",
          review.userReaction === "like" &&
            "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-200",
        )}
      >
        <ThumbsUp className={cn("size-4", review.userReaction === "like" && "fill-current")} />
        <span>{review.likeCount}</span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={review.isOwn}
        aria-pressed={review.userReaction === "dislike"}
        aria-label={`${REVIEWS_COPY.dislike}. ${review.dislikeCount}`}
        onClick={() => onReact(review.id, "dislike")}
        className={cn(
          "h-9 gap-1.5 rounded-full px-3",
          review.userReaction === "dislike" &&
            "bg-amber-100 text-amber-900 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-100",
        )}
      >
        <ThumbsDown
          className={cn("size-4", review.userReaction === "dislike" && "fill-current")}
        />
        <span>{review.dislikeCount}</span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-9 gap-1.5 rounded-full px-3"
        aria-label={`${REVIEWS_COPY.comments}. ${review.commentCount}`}
        onClick={onOpenComments}
      >
        <MessageCircle className="size-4" />
        <span>{review.commentCount}</span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="ml-auto h-9 rounded-full px-3"
        onClick={share}
      >
        {REVIEWS_COPY.share}
      </Button>
    </div>
  );
}
