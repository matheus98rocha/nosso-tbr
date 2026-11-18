import { describe, expect, it } from "vitest";

import {
  mapReviewComment,
  mapReviewFeedPage,
  mapReviewFeedRow,
  type ReviewCommentRow,
  type ReviewFeedRow,
} from "./review.mapper";

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

  it("marca editada só depois de 1s e pagina pela data de criação", () => {
    const created = "2026-11-01T00:00:00.000Z";
    expect(
      mapReviewFeedRow(row({ updated_at: "2026-11-01T00:00:01.000Z" }), null).edited,
    ).toBe(false);
    expect(
      mapReviewFeedRow(row({ updated_at: "2026-11-01T00:00:01.001Z" }), null).edited,
    ).toBe(true);

    expect(mapReviewFeedPage([row()], null, 2).nextCursor).toBeNull();

    const page = mapReviewFeedPage(
      [
        row({ id: "a" }),
        row({
          id: "b",
          created_at: created,
          updated_at: "2026-11-02T00:00:00.000Z",
        }),
      ],
      null,
      2,
    );
    expect(page.nextCursor).toEqual({ createdAt: created, id: "b" });
  });

  it("cai no nome, no status e na contagem quando o banco vem incompleto", () => {
    const mapped = mapReviewFeedRow(
      row({
        author_display_name: "  ",
        book_title: "",
        book_authors: null,
        reading_status: "desconhecido",
        like_count: "nope",
        dislike_count: Number.POSITIVE_INFINITY,
        comment_count: "x",
        user_reaction: "love",
      }),
      null,
    );

    expect(mapped).toMatchObject({
      authorDisplayName: "Leitor",
      bookTitle: "Livro",
      bookAuthors: "",
      readingStatus: "not_started",
      likeCount: 0,
      dislikeCount: 0,
      commentCount: 0,
      userReaction: null,
    });
  });
});

function comment(users: ReviewCommentRow["users"]): ReviewCommentRow {
  return {
    id: "comment-1",
    review_id: "review-1",
    user_id: "author-1",
    parent_id: null,
    content: "Oi",
    created_at: "2026-11-01T00:00:00.000Z",
    users,
  };
}

describe("mapReviewComment", () => {
  it("lê o autor em objeto ou lista e usa Leitor quando o nome vem vazio", () => {
    expect(mapReviewComment(comment([{ display_name: "  Ana  ", avatar_seed: "s" }]))).toMatchObject({
      authorDisplayName: "Ana",
      authorAvatarSeed: "s",
    });
    expect(mapReviewComment(comment({ display_name: "Bia", avatar_seed: null })).authorDisplayName).toBe(
      "Bia",
    );

    const blanks: ReviewCommentRow["users"][] = [{ display_name: " " }, null, []];
    for (const users of blanks) {
      expect(mapReviewComment(comment(users)).authorDisplayName).toBe("Leitor");
    }
  });
});
