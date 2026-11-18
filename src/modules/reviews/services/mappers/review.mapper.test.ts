import { describe, expect, it } from "vitest";

import {
  mapReviewComment,
  mapReviewFeedPage,
  mapReviewFeedRow,
  mapReviewMine,
  type ReviewFeedRow,
} from "./review.mapper";

function row(overrides: Partial<ReviewFeedRow> = {}): ReviewFeedRow {
  return {
    id: "review-1",
    user_id: "author-1",
    author_display_name: "Ana",
    author_avatar_seed: "seed",
    book_id: "book-1",
    book_title: "O Hobbit",
    book_image_url: null,
    book_authors: "Tolkien",
    stars: 5,
    content: "Bom",
    reading_status: "finished",
    created_at: "2026-11-01T00:00:00.000Z",
    updated_at: "2026-11-01T00:00:00.000Z",
    like_count: 0,
    dislike_count: 0,
    comment_count: 0,
    user_reaction: null,
    ...overrides,
  };
}

describe("mapReviewFeedRow", () => {
  it("só marca editada depois de um segundo e trata data inválida como original", () => {
    expect(
      mapReviewFeedRow(
        row({ updated_at: "2026-11-01T00:00:01.000Z" }),
        null,
      ).edited,
    ).toBe(false);
    expect(
      mapReviewFeedRow(
        row({ updated_at: "2026-11-01T00:00:01.001Z" }),
        null,
      ).edited,
    ).toBe(true);
    expect(mapReviewFeedRow(row({ updated_at: "não-é-data" }), null).edited).toBe(false);
  });

  it("zera contagem inválida, ignora reação desconhecida e preenche nomes vazios", () => {
    const item = mapReviewFeedRow(
      row({
        author_display_name: "  ",
        book_title: null,
        book_authors: "  ",
        reading_status: "wishlist",
        like_count: "nope",
        dislike_count: " 4 ",
        comment_count: "2",
        user_reaction: "star",
        stars: "3" as unknown as number,
      }),
      "author-1",
    );

    expect(item).toMatchObject({
      authorDisplayName: "Leitor",
      bookTitle: "Livro",
      bookAuthors: "",
      readingStatus: "not_started",
      likeCount: 0,
      dislikeCount: 4,
      commentCount: 2,
      userReaction: null,
      stars: 3,
      isOwn: true,
    });
    expect(mapReviewFeedRow(row(), null).isOwn).toBe(false);
  });
});

describe("mapReviewFeedPage", () => {
  it("abre o cursor só quando a página vem cheia", () => {
    const full = mapReviewFeedPage(
      [row({ id: "a" }), row({ id: "b", created_at: "2026-11-02T00:00:00.000Z" })],
      "author-1",
      2,
    );
    expect(full.nextCursor).toEqual({
      createdAt: "2026-11-02T00:00:00.000Z",
      id: "b",
    });

    const short = mapReviewFeedPage([row()], null, 2);
    expect(short.nextCursor).toBeNull();
    expect(short.reviews).toHaveLength(1);
  });
});

describe("mapReviewComment", () => {
  it("usa o primeiro usuário embutido e cai em Leitor quando o nome vem vazio", () => {
    expect(
      mapReviewComment({
        id: "c1",
        review_id: "review-1",
        user_id: "user-1",
        parent_id: null,
        content: "Oi",
        created_at: "2026-11-01T00:00:00.000Z",
        users: [{ display_name: "  Ana  ", avatar_seed: "seed" }],
      }),
    ).toMatchObject({
      authorDisplayName: "Ana",
      authorAvatarSeed: "seed",
    });

    expect(
      mapReviewComment({
        id: "c2",
        review_id: "review-1",
        user_id: "user-1",
        parent_id: "c1",
        content: "Resposta",
        created_at: "2026-11-01T00:00:00.000Z",
        users: { display_name: "   ", avatar_seed: null },
      }).authorDisplayName,
    ).toBe("Leitor");
  });
});

describe("mapReviewMine", () => {
  it("trata status desconhecido como ainda não começou", () => {
    expect(
      mapReviewMine({
        id: "review-1",
        stars: "4" as unknown as number,
        content: "Oi",
        reading_status: "wishlist",
      }),
    ).toEqual({
      id: "review-1",
      stars: 4,
      content: "Oi",
      readingStatus: "not_started",
    });
  });
});
