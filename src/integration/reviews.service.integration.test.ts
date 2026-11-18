import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const from = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    rpc,
    from,
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      }),
    },
  }),
}));

import { ReviewsService } from "@/modules/reviews/services";

describe("ReviewsService", () => {
  beforeEach(() => {
    rpc.mockReset();
    from.mockReset();
  });

  it("pede a página seguinte pelo cursor e marca a resenha editada", async () => {
    rpc.mockResolvedValue({
      data: [
        {
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
          updated_at: "2026-11-02T00:00:00.000Z",
          like_count: "2",
          dislike_count: 0,
          comment_count: 1,
          user_reaction: "like",
        },
      ],
      error: null,
    });

    const page = await new ReviewsService().listFeed(
      "following",
      { createdAt: "2026-11-03T00:00:00.000Z", id: "review-0" },
      "user-1",
      10,
    );

    expect(rpc).toHaveBeenCalledWith("get_review_feed", {
      p_scope: "following",
      p_limit: 10,
      p_before_created_at: "2026-11-03T00:00:00.000Z",
      p_before_id: "review-0",
    });
    expect(page.reviews[0]).toMatchObject({
      authorDisplayName: "Ana",
      readingStatus: "finished",
      edited: true,
      likeCount: 2,
      userReaction: "like",
      isOwn: false,
    });
    expect(page.nextCursor).toBeNull();
  });

  it("lista só os livros em que a pessoa participa", async () => {
    const query = {
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            id: "book-1",
            title: "Meu livro",
            status: "paused",
            image_url: null,
            readers: ["user-1"],
            chosen_by: "user-1",
            user_id: "user-1",
            author: { name: "Autora" },
          },
          {
            id: "book-2",
            title: "De outra pessoa",
            status: "reading",
            image_url: null,
            readers: ["other"],
            chosen_by: "other",
            user_id: "other",
            author: { name: "Outro" },
          },
        ],
        error: null,
      }),
    };
    from.mockReturnValue({ select: vi.fn(() => query) });

    const books = await new ReviewsService().listParticipatingBooks(["book-1"]);

    expect(books).toEqual([
      {
        id: "book-1",
        title: "Meu livro",
        author: "Autora",
        imageUrl: null,
        status: "paused",
        isSolo: true,
        hasReview: true,
      },
    ]);
  });
});
