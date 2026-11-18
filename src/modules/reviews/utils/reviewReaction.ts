import type { ReviewReaction } from "../types";

export function toggleReviewReaction(
  current: {
    userReaction: ReviewReaction | null;
    likeCount: number;
    dislikeCount: number;
  },
  reaction: ReviewReaction,
) {
  let likeCount = current.likeCount;
  let dislikeCount = current.dislikeCount;
  let userReaction: ReviewReaction | null = reaction;

  if (current.userReaction === reaction) {
    userReaction = null;
    if (reaction === "like") likeCount -= 1;
    else dislikeCount -= 1;
  } else {
    if (current.userReaction === "like") likeCount -= 1;
    if (current.userReaction === "dislike") dislikeCount -= 1;
    if (reaction === "like") likeCount += 1;
    else dislikeCount += 1;
  }

  return {
    userReaction,
    likeCount: Math.max(0, likeCount),
    dislikeCount: Math.max(0, dislikeCount),
  };
}
