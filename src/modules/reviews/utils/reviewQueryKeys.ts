import type { ReviewScope } from "../types";

export const reviewQueryKeys = {
  all: ["reviews"] as const,
  feed: (userId: string | null, scope: ReviewScope) =>
    ["reviews", "feed", userId ?? "anonymous", scope] as const,
  comments: (reviewId: string) => ["reviews", "comments", reviewId] as const,
  mineByBook: (userId: string | null, bookId: string) =>
    ["reviews", "mine", "book", userId ?? "anonymous", bookId] as const,
  myBookIds: (userId: string) => ["reviews", "mine", "bookIds", userId] as const,
  bookOptions: (userId: string) => ["reviews", "books", userId] as const,
};
