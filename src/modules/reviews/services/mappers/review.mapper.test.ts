import { describe, expect, it } from "vitest";

import {
  mapReviewComment,
  mapReviewFeedPage,
  mapReviewFeedRow,
  type ReviewCommentRow,
  type ReviewFeedRow,
} from "./review.mapper";

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

  it("marca edição só depois de 1s e completa nomes, status, reação e contagens ruins", () => {
    const createdAt = "2026-11-01T00:00:00.000Z";
    const exact = mapReviewFeedRow(
      row({
        created_at: createdAt,
        updated_at: "2026-11-01T00:00:01.000Z",
        author_display_name: "  ",
        book_title: null,
        book_authors: "   ",
        reading_status: "nope",
        like_count: "x",
        dislike_count: "Infinity",
        comment_count: "",
        user_reaction: "love",
      }),
      "author-1",
    );
    expect(exact.edited).toBe(false);
    expect(exact).toMatchObject({
      authorDisplayName: "Leitor",
      bookTitle: "Livro",
      bookAuthors: "",
      readingStatus: "not_started",
      likeCount: 0,
      dislikeCount: 0,
      commentCount: 0,
      userReaction: null,
      isOwn: true,
    });

    expect(
      mapReviewFeedRow(
        row({
          created_at: createdAt,
          updated_at: "2026-11-01T00:00:01.001Z",
          user_reaction: "dislike",
        }),
        null,
      ),
    ).toMatchObject({ edited: true, userReaction: "dislike", isOwn: false });
  });

  it("só devolve cursor quando a página vem cheia", () => {
    const first = row({ id: "review-1" });
    const second = row({ id: "review-2", created_at: "2026-10-01T00:00:00.000Z" });

    expect(mapReviewFeedPage([first], null, 2).nextCursor).toBeNull();
    expect(mapReviewFeedPage([], null, 1)).toEqual({ reviews: [], nextCursor: null });
    expect(mapReviewFeedPage([first, second], "author-1", 2).nextCursor).toEqual({
      createdAt: second.created_at,
      id: "review-2",
    });
  });
});

function comment(overrides: Partial<ReviewCommentRow> = {}): ReviewCommentRow {
  return {
    id: "comment-1",
    review_id: "review-1",
    user_id: "author-1",
    parent_id: null,
    content: "Oi",
    created_at: "2026-11-01T00:00:00.000Z",
    users: { display_name: "Ana", avatar_seed: "seed" },
    ...overrides,
  };
}

describe("mapReviewComment", () => {
  it("lê o autor embutido em objeto ou lista e cai em Leitor quando o nome falta", () => {
    expect(mapReviewComment(comment())).toMatchObject({
      authorDisplayName: "Ana",
      authorAvatarSeed: "seed",
      parentId: null,
    });
    expect(
      mapReviewComment(
        comment({
          parent_id: "root",
          users: [{ display_name: "  Bia  ", avatar_seed: null }],
        }),
      ),
    ).toMatchObject({
      authorDisplayName: "Bia",
      authorAvatarSeed: null,
      parentId: "root",
    });
    expect(mapReviewComment(comment({ users: { display_name: "   " } })).authorDisplayName).toBe(
      "Leitor",
    );
    expect(mapReviewComment(comment({ users: null }))).toMatchObject({
      authorDisplayName: "Leitor",
      authorAvatarSeed: null,
    });
    expect(mapReviewComment(comment({ users: [] })).authorDisplayName).toBe("Leitor");
  });
});
