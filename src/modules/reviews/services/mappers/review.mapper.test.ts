import { describe, expect, it } from "vitest";

import { mapReviewFeedRow, type ReviewFeedRow } from "./review.mapper";

function row(patch: Partial<ReviewFeedRow> = {}): ReviewFeedRow {
  return {
    id: "review-1",
    user_id: "author-1",
    author_display_name: "Ana",
    author_avatar_seed: null,
    book_id: "book-1",
    book_title: "O Hobbit",
    book_image_url: null,
    book_authors: "Tolkien",
    book_is_solo: false,
    stars: 5,
    content: "Bom",
    reading_status: "finished",
    created_at: "2026-11-01T00:00:00.000Z",
    updated_at: "2026-11-01T00:00:00.000Z",
    like_count: "3",
    dislike_count: "1",
    comment_count: "2",
    user_reaction: "dislike",
    ...patch,
  };
}

describe("mapReviewFeedRow", () => {
  it("só marca livro solo quando a flag é exatamente true", () => {
    expect(mapReviewFeedRow(row({ book_is_solo: true }), null).bookIsSolo).toBe(true);

    for (const book_is_solo of [false, null, undefined]) {
      expect(mapReviewFeedRow(row({ book_is_solo }), null).bookIsSolo).toBe(false);
    }
  });

  it("mantém curtidas e comentários fora da flag de livro solo", () => {
    const mapped = mapReviewFeedRow(row(), "author-1");

    expect(mapped).toMatchObject({
      bookIsSolo: false,
      likeCount: 3,
      dislikeCount: 1,
      commentCount: 2,
      userReaction: "dislike",
      isOwn: true,
    });
    expect(mapReviewFeedRow(row(), "outra-pessoa").isOwn).toBe(false);
    expect(mapReviewFeedRow(row(), null).isOwn).toBe(false);
  });
});
