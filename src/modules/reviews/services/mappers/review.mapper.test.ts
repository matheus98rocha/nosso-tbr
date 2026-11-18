import { describe, expect, it } from "vitest";

import { mapReviewFeedRow, type ReviewFeedRow } from "./review.mapper";

function row(overrides: Partial<ReviewFeedRow> = {}): ReviewFeedRow {
  return {
    id: "review-1",
    user_id: "author-1",
    author_display_name: "Ana",
    author_avatar_seed: null,
    book_id: "book-1",
    book_title: "O Hobbit",
    book_image_url: null,
    book_authors: "Tolkien",
    stars: 5,
    content: "Bom",
    reading_status: "finished",
    created_at: "2026-11-01T00:00:00.000Z",
    updated_at: "2026-11-01T00:00:00.000Z",
    like_count: 2,
    dislike_count: 0,
    comment_count: 1,
    user_reaction: null,
    ...overrides,
  };
}

describe("mapReviewFeedRow", () => {
  it("só trata o livro como privado quando a flag booleana é verdadeira", () => {
    expect(mapReviewFeedRow(row({ book_is_solo: true }), null).bookIsSolo).toBe(true);
    expect(mapReviewFeedRow(row({ book_is_solo: false }), null).bookIsSolo).toBe(false);
    expect(mapReviewFeedRow(row({ book_is_solo: null }), null).bookIsSolo).toBe(false);
    expect(mapReviewFeedRow(row(), null).bookIsSolo).toBe(false);
    expect(
      mapReviewFeedRow(row({ book_is_solo: 1 as unknown as boolean }), null).bookIsSolo,
    ).toBe(false);
  });
});
