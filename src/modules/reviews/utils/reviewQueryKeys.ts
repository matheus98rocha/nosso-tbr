import type { ReviewScope } from "../types";

export const reviewQueryKeys = {
  all: ["reviews"] as const,
  feed: (scope: ReviewScope, viewerUserId: string | null) =>
    ["reviews", "feed", scope, viewerUserId] as const,
  comments: (reviewId: string) => ["reviews", "comments", reviewId] as const,
  mineByBook: (bookId: string) => ["reviews", "mine", "book", bookId] as const,
  myBookIds: (userId: string) => ["reviews", "mine", "bookIds", userId] as const,
  bookOptions: (userId: string) => ["reviews", "books", userId] as const,
};
