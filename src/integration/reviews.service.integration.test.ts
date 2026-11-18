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

function chain(result: { data: unknown; error: unknown }) {
  const promise = Promise.resolve(result);
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    or: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn(() => promise),
    then: promise.then.bind(promise),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.or.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  return query;
}

import { ReviewsService } from "@/modules/reviews/services";

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

  it("sem sessão não consulta livros nem resenhas", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const service = new ReviewsService();

    await expect(service.listMyBookIds()).resolves.toEqual([]);
    await expect(service.getMineByBookId("book-1")).resolves.toEqual({
      review: null,
      ratingStars: null,
    });
    await expect(service.listParticipatingBooks(["book-1"])).resolves.toEqual([]);
    expect(from).not.toHaveBeenCalled();
  });

  it("propaga o erro do feed e manda cursor nulo na primeira página", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: "rpc down" } });
    await expect(
      new ReviewsService().listFeed("all", null, "user-1"),
    ).rejects.toThrow("rpc down");

    rpc.mockResolvedValueOnce({ data: null, error: null });
    const page = await new ReviewsService().listFeed("mine", null, null);
    expect(rpc).toHaveBeenLastCalledWith("get_review_feed", {
      p_scope: "mine",
      p_limit: 10,
      p_before_created_at: null,
      p_before_id: null,
    });
    expect(page).toEqual({ reviews: [], nextCursor: null });
  });

  it("ignora estrela que não é número e trata status desconhecido como não iniciado", async () => {
    from.mockImplementation((table: string) => {
      if (table === "book_reviews") {
        return chain({
          data: {
            id: "review-1",
            stars: 4,
            content: "Oi",
            reading_status: "weird",
          },
          error: null,
        });
      }
      return chain({ data: { stars: "5" }, error: null });
    });

    await expect(new ReviewsService().getMineByBookId("book-1")).resolves.toEqual({
      review: {
        id: "review-1",
        stars: 4,
        content: "Oi",
        readingStatus: "not_started",
      },
      ratingStars: null,
    });
  });

  it("falha a leitura da resenha salva sem devolver a nota", async () => {
    from.mockImplementation((table: string) => {
      if (table === "book_reviews") {
        return chain({ data: null, error: { message: "review down" } });
      }
      return chain({ data: { stars: 5 }, error: null });
    });

    await expect(new ReviewsService().getMineByBookId("book-1")).rejects.toThrow(
      "review down",
    );
  });

  it("lê o autor em lista e descarta nome em branco ou status fora da lista", async () => {
    const query = {
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            id: "book-3",
            title: "Coletivo",
            status: "nope",
            image_url: "https://cover",
            readers: ["user-1", "user-2"],
            chosen_by: "user-2",
            user_id: "user-2",
            author: [{ name: "  Ada  " }],
          },
          {
            id: "book-4",
            title: "Sem autor",
            status: null,
            image_url: null,
            readers: null,
            chosen_by: null,
            user_id: "user-1",
            author: [{ name: "   " }],
          },
        ],
        error: null,
      }),
    };
    from.mockReturnValue({ select: vi.fn(() => query) });

    await expect(new ReviewsService().listParticipatingBooks(["book-4"])).resolves.toEqual([
      {
        id: "book-3",
        title: "Coletivo",
        author: "Ada",
        imageUrl: "https://cover",
        status: "not_started",
        isSolo: false,
        hasReview: false,
      },
      {
        id: "book-4",
        title: "Sem autor",
        author: null,
        imageUrl: null,
        status: "not_started",
        isSolo: false,
        hasReview: true,
      },
    ]);
  });
});
