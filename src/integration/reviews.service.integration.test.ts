import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const from = vi.fn();
const getUser = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    rpc,
    from,
    auth: {
      getUser,
    },
  }),
}));

import { ReviewsService } from "@/modules/reviews/services";

function thenable(result: { data: unknown; error: unknown }) {
  const promise = Promise.resolve(result);
  const proxy: object = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "then") return promise.then.bind(promise);
        return () => proxy;
      },
    },
  );
  return proxy;
}

describe("ReviewsService", () => {
  beforeEach(() => {
    rpc.mockReset();
    from.mockReset();
    getUser.mockReset();
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
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
          book_is_solo: true,
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
      bookIsSolo: true,
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

  it("propaga o erro do feed e pede a primeira página sem cursor", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: "rpc down" } });
    await expect(
      new ReviewsService().listFeed("all", null, "user-1"),
    ).rejects.toThrow("rpc down");

    rpc.mockResolvedValueOnce({ data: null, error: null });
    const page = await new ReviewsService().listFeed("mine", null, "user-1");
    expect(rpc).toHaveBeenLastCalledWith("get_review_feed", {
      p_scope: "mine",
      p_limit: 10,
      p_before_created_at: null,
      p_before_id: null,
    });
    expect(page).toEqual({ reviews: [], nextCursor: null });
  });

  it("sem sessão, não consulta resenhas nem livros", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const service = new ReviewsService();

    await expect(service.listMyBookIds()).resolves.toEqual([]);
    await expect(service.listParticipatingBooks(["book-1"])).resolves.toEqual([]);
    await expect(service.getMineByBookId("book-1")).resolves.toEqual({
      review: null,
      ratingStars: null,
    });
    expect(from).not.toHaveBeenCalled();
  });

  it("falha a leitura da resenha e ignora estrelas que não são número", async () => {
    from.mockImplementation((name: string) => {
      if (name === "book_reviews") {
        return thenable({ data: null, error: { message: "review down" } });
      }
      return thenable({ data: { stars: 4 }, error: null });
    });
    await expect(new ReviewsService().getMineByBookId("book-1")).rejects.toThrow(
      "review down",
    );

    from.mockImplementation((name: string) => {
      if (name === "book_reviews") {
        return thenable({
          data: {
            id: "review-1",
            stars: 5,
            content: "Oi",
            reading_status: "paused",
          },
          error: null,
        });
      }
      return thenable({ data: { stars: "4" }, error: null });
    });
    await expect(new ReviewsService().getMineByBookId("book-1")).resolves.toEqual({
      review: {
        id: "review-1",
        stars: 5,
        content: "Oi",
        readingStatus: "paused",
      },
      ratingStars: null,
    });
  });

  it("normaliza autor em lista e status desconhecido dos livros da pessoa", async () => {
    const query = {
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            id: "book-3",
            title: "Lista",
            status: "wishlist",
            image_url: null,
            readers: null,
            chosen_by: "other",
            user_id: "user-1",
            author: [{ name: "  Ada  " }],
          },
        ],
        error: null,
      }),
    };
    from.mockReturnValue({ select: vi.fn(() => query) });

    const books = await new ReviewsService().listParticipatingBooks([]);

    expect(books).toEqual([
      {
        id: "book-3",
        title: "Lista",
        author: "Ada",
        imageUrl: null,
        status: "not_started",
        isSolo: false,
        hasReview: false,
      },
    ]);
  });
});
