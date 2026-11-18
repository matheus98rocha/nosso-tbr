import { describe, expect, it, vi } from "vitest";

const REVIEW_ID = "550e8400-e29b-41d4-a716-446655440010";
const USER_ID = "660e8400-e29b-41d4-a716-446655440002";
const AUTHOR_ID = "770e8400-e29b-41d4-a716-446655440003";

function table(result: { data: unknown; error: unknown }) {
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

async function loadRoute(options: {
  userId?: string | null;
  authorId?: string | null;
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
      return table({
        data: [{ user_id: USER_ID, reaction: "like" }],
        error: null,
      });
    }),
  };
  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue(client),
  }));
  return import("./route");
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
    const route = await loadRoute({ userId: null });
    const response = await route.POST(post({ reviewId: REVIEW_ID, reaction: "like" }));
    expect(response.status).toBe(401);
  });

  it("retorna 400 com reação inválida", async () => {
    const route = await loadRoute({ userId: USER_ID });
    const response = await route.POST(post({ reviewId: REVIEW_ID, reaction: "love" }));
    expect(response.status).toBe(400);
  });

  it("retorna 403 na própria resenha", async () => {
    const route = await loadRoute({ userId: AUTHOR_ID, authorId: AUTHOR_ID });
    const response = await route.POST(post({ reviewId: REVIEW_ID, reaction: "like" }));
    expect(response.status).toBe(403);
  });

  it("grava a reação e devolve as contagens", async () => {
    const route = await loadRoute({ userId: USER_ID, authorId: AUTHOR_ID });
    const response = await route.POST(post({ reviewId: REVIEW_ID, reaction: "like" }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      reviewId: REVIEW_ID,
      likeCount: 1,
      dislikeCount: 0,
      userReaction: "like",
    });
  });
});

function formatArg(value: unknown) {
  if (value && typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function chain(result: { data: unknown; error: unknown }, log: string[]) {
  const promise = Promise.resolve(result);
  const proxy: object = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "then") return promise.then.bind(promise);
        return (...args: unknown[]) => {
          log.push(`${String(prop)}:${args.map(formatArg).join(",")}`);
          return proxy;
        };
      },
    },
  );
  return proxy;
}

async function loadTracked(options: {
  userId?: string | null;
  review?: { id: string; user_id: string } | null;
  reviewError?: string | null;
  reactions?: Array<{ user_id: string; reaction: string }>;
  writeError?: string | null;
}) {
  const log: string[] = [];
  const userId = options.userId === undefined ? USER_ID : options.userId;
  vi.resetModules();
  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: userId ? { id: userId } : null },
          error: null,
        }),
      },
      from: vi.fn((name: string) => {
        log.push(`from:${name}`);
        if (name === "book_reviews") {
          return chain(
            {
              data: options.reviewError
                ? null
                : options.review === undefined
                  ? { id: REVIEW_ID, user_id: AUTHOR_ID }
                  : options.review,
              error: options.reviewError ? { message: options.reviewError } : null,
            },
            log,
          );
        }
        return chain(
          {
            data: options.writeError ? null : (options.reactions ?? []),
            error: options.writeError ? { message: options.writeError } : null,
          },
          log,
        );
      }),
    }),
  }));
  return { route: await import("./route"), log };
}

describe("POST /api/review-reactions writes", () => {
  it("não grava na própria resenha", async () => {
    const { route, log } = await loadTracked({
      userId: AUTHOR_ID,
      review: { id: REVIEW_ID, user_id: AUTHOR_ID },
    });
    const response = await route.POST(post({ reviewId: REVIEW_ID, reaction: "like" }));

    expect(response.status).toBe(403);
    expect(log).not.toContain("from:book_review_reactions");
    expect(log.some((entry) => entry.startsWith("upsert") || entry.startsWith("delete"))).toBe(
      false,
    );
  });

  it("retorna 404 sem resenha e não grava", async () => {
    const { route, log } = await loadTracked({ review: null });
    const response = await route.POST(post({ reviewId: REVIEW_ID, reaction: "like" }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Resenha não encontrada" });
    expect(log).not.toContain("from:book_review_reactions");
  });

  it("retorna 500 na leitura da resenha e não grava", async () => {
    const { route, log } = await loadTracked({ reviewError: "falha ao ler" });
    const response = await route.POST(post({ reviewId: REVIEW_ID, reaction: "dislike" }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "falha ao ler" });
    expect(log).not.toContain("from:book_review_reactions");
  });

  it("desfaz só a reação de quem está na sessão", async () => {
    const { route, log } = await loadTracked({
      reactions: [{ user_id: USER_ID, reaction: "like" }],
    });
    const response = await route.POST(post({ reviewId: REVIEW_ID, reaction: null }));

    expect(response.status).toBe(200);
    expect(log.some((entry) => entry.startsWith("delete"))).toBe(true);
    expect(log.some((entry) => entry.startsWith("upsert"))).toBe(false);
    expect(log).toContain(`eq:review_id,${REVIEW_ID}`);
    expect(log).toContain(`eq:user_id,${USER_ID}`);
  });

  it("não conta reação fora de curtir e não curtir", async () => {
    const { route } = await loadTracked({
      reactions: [
        { user_id: "someone", reaction: "like" },
        { user_id: "other", reaction: "love" },
        { user_id: USER_ID, reaction: "nope" },
      ],
    });
    const response = await route.POST(post({ reviewId: REVIEW_ID, reaction: "like" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      reviewId: REVIEW_ID,
      likeCount: 1,
      dislikeCount: 0,
      userReaction: null,
    });
  });

  it("não lê o agregado quando a gravação falha", async () => {
    const { route, log } = await loadTracked({ writeError: "falha ao gravar" });
    const response = await route.POST(post({ reviewId: REVIEW_ID, reaction: "like" }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "falha ao gravar" });
    expect(log.filter((entry) => entry === "from:book_review_reactions")).toHaveLength(1);
  });
});
