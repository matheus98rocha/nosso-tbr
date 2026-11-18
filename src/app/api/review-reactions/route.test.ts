import { describe, expect, it, vi } from "vitest";

const REVIEW_ID = "550e8400-e29b-41d4-a716-446655440010";
const USER_ID = "660e8400-e29b-41d4-a716-446655440002";
const AUTHOR_ID = "770e8400-e29b-41d4-a716-446655440003";

function table(
  result: { data: unknown; error: unknown },
  writes?: { op: string }[],
) {
  const promise = Promise.resolve(result);
  const proxy: object = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "then") return promise.then.bind(promise);
        return () => {
          if (writes && (prop === "upsert" || prop === "delete" || prop === "insert")) {
            writes.push({ op: String(prop) });
          }
          return proxy;
        };
      },
    },
  );
  return proxy;
}

async function loadRoute(options: {
  userId?: string | null;
  authorId?: string | null;
  reactions?: { user_id: string; reaction: string }[];
  writes?: { op: string }[];
}) {
  vi.resetModules();
  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: options.userId ? { id: options.userId } : null },
        error: null,
      }),
    },
    from: vi.fn((name: string) => {
      if (name === "book_reviews") {
        return table({
          data:
            options.authorId === null
              ? null
              : { id: REVIEW_ID, user_id: options.authorId ?? AUTHOR_ID },
          error: null,
        });
      }
      return table(
        {
          data: options.reactions ?? [{ user_id: USER_ID, reaction: "like" }],
          error: null,
        },
        options.writes,
      );
    }),
  };
  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue(client),
  }));
  return { route: await import("./route"), client };
}

function post(body: unknown) {
  return new Request("http://localhost/api/review-reactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/review-reactions", () => {
  it("retorna 401 sem sessão", async () => {
    const { route } = await loadRoute({ userId: null });
    const response = await route.POST(post({ reviewId: REVIEW_ID, reaction: "like" }));
    expect(response.status).toBe(401);
  });

  it("retorna 400 com reação inválida", async () => {
    const { route } = await loadRoute({ userId: USER_ID });
    const response = await route.POST(post({ reviewId: REVIEW_ID, reaction: "love" }));
    expect(response.status).toBe(400);
  });

  it("retorna 403 na própria resenha", async () => {
    const { route } = await loadRoute({ userId: AUTHOR_ID, authorId: AUTHOR_ID });
    const response = await route.POST(post({ reviewId: REVIEW_ID, reaction: "like" }));
    expect(response.status).toBe(403);
  });

  it("grava a reação e devolve as contagens", async () => {
    const { route } = await loadRoute({ userId: USER_ID, authorId: AUTHOR_ID });
    const response = await route.POST(post({ reviewId: REVIEW_ID, reaction: "like" }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      reviewId: REVIEW_ID,
      likeCount: 1,
      dislikeCount: 0,
      userReaction: "like",
    });
  });

  it("retorna 404 quando a resenha não existe e não grava reação", async () => {
    const writes: { op: string }[] = [];
    const { route, client } = await loadRoute({
      userId: USER_ID,
      authorId: null,
      writes,
    });
    const response = await route.POST(post({ reviewId: REVIEW_ID, reaction: "like" }));
    expect(response.status).toBe(404);
    expect(client.from).not.toHaveBeenCalledWith("book_review_reactions");
    expect(writes).toEqual([]);
  });

  it("apaga a reação quando o corpo vem nulo", async () => {
    const writes: { op: string }[] = [];
    const { route } = await loadRoute({
      userId: USER_ID,
      authorId: AUTHOR_ID,
      reactions: [],
      writes,
    });
    const response = await route.POST(post({ reviewId: REVIEW_ID, reaction: null }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      reviewId: REVIEW_ID,
      likeCount: 0,
      dislikeCount: 0,
      userReaction: null,
    });
    expect(writes).toEqual([{ op: "delete" }]);
  });

  it("soma curtidas e não curtidas e ignora reação desconhecida", async () => {
    const writes: { op: string }[] = [];
    const { route } = await loadRoute({
      userId: USER_ID,
      authorId: AUTHOR_ID,
      writes,
      reactions: [
        { user_id: "a", reaction: "like" },
        { user_id: "b", reaction: "like" },
        { user_id: USER_ID, reaction: "dislike" },
        { user_id: "c", reaction: "star" },
      ],
    });
    const response = await route.POST(post({ reviewId: REVIEW_ID, reaction: "like" }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      reviewId: REVIEW_ID,
      likeCount: 2,
      dislikeCount: 1,
      userReaction: "dislike",
    });
    expect(writes).toEqual([{ op: "upsert" }]);
  });
});
