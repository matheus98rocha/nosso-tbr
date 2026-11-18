import { describe, expect, it, vi } from "vitest";

const REVIEW_ID = "550e8400-e29b-41d4-a716-446655440010";
const OTHER_REVIEW_ID = "aa0e8400-e29b-41d4-a716-446655440099";
const USER_ID = "660e8400-e29b-41d4-a716-446655440002";
const PARENT_ID = "880e8400-e29b-41d4-a716-446655440004";
const ROOT_ID = "990e8400-e29b-41d4-a716-446655440005";

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

async function loadRoute() {
  vi.resetModules();
  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: USER_ID } },
        error: null,
      }),
    },
    from: vi.fn((name: string) => {
      if (name === "book_reviews") {
        return table({ data: { id: REVIEW_ID }, error: null });
      }
      if (name === "book_review_comments") {
        return table({
          data: {
            id: "comment-1",
            review_id: REVIEW_ID,
            user_id: USER_ID,
            parent_id: ROOT_ID,
            content: "Resposta",
            created_at: "2026-11-18T00:00:00.000Z",
          },
          error: null,
        });
      }
      return table({ data: null, error: null });
    }),
  };
  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue(client),
  }));
  return { route: await import("./route"), client };
}

describe("POST /api/review-comments", () => {
  it("retorna 401 sem sessão", async () => {
    vi.resetModules();
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
        from: vi.fn(),
      }),
    }));
    const route = await import("./route");
    const response = await route.POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: REVIEW_ID, content: "Oi" }),
      }),
    );
    expect(response.status).toBe(401);
  });

  it("retorna 400 sem texto", async () => {
    const { route } = await loadRoute();
    const response = await route.POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: REVIEW_ID, content: "   " }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("publica o comentário quando a resenha existe", async () => {
    const { route } = await loadRoute();
    const response = await route.POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId: REVIEW_ID,
          content: "Concordo",
          parentId: PARENT_ID,
        }),
      }),
    );
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.review_id).toBe(REVIEW_ID);
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

function trackedClient(options: {
  userId?: string | null;
  review?: { id: string } | null;
  reviewError?: string | null;
  commentSteps?: Array<{ data: unknown; error: { message: string } | null }>;
}) {
  const log: string[] = [];
  const userId = options.userId === undefined ? USER_ID : options.userId;
  const commentSteps = options.commentSteps ?? [];
  let commentCall = 0;

  return {
    log,
    client: {
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
                  ? { id: REVIEW_ID }
                  : options.review,
              error: options.reviewError ? { message: options.reviewError } : null,
            },
            log,
          );
        }
        const result = commentSteps[commentCall] ?? {
          data: null,
          error: null,
        };
        commentCall += 1;
        return chain(result, log);
      }),
    },
  };
}

async function loadTracked(options: Parameters<typeof trackedClient>[0]) {
  const tracked = trackedClient(options);
  vi.resetModules();
  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue(tracked.client),
  }));
  return { route: await import("./route"), log: tracked.log };
}

function post(body: unknown) {
  return new Request("http://localhost/api/review-comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function inserted(parentId: string | null, content: string) {
  return {
    id: "comment-1",
    review_id: REVIEW_ID,
    user_id: USER_ID,
    parent_id: parentId,
    content,
    created_at: "2026-11-18T00:00:00.000Z",
  };
}

describe("POST /api/review-comments threads", () => {
  it("responde à resposta no comentário principal", async () => {
    const content = "mesma conversa";
    const { route, log } = await loadTracked({
      commentSteps: [
        {
          data: { id: PARENT_ID, review_id: REVIEW_ID, parent_id: ROOT_ID },
          error: null,
        },
        { data: inserted(ROOT_ID, content), error: null },
      ],
    });

    const response = await route.POST(
      post({ reviewId: REVIEW_ID, content: `  ${content}  `, parentId: PARENT_ID }),
    );

    expect(response.status).toBe(201);
    expect(log).toContain(
      `insert:${JSON.stringify({
        review_id: REVIEW_ID,
        user_id: USER_ID,
        parent_id: ROOT_ID,
        content,
      })}`,
    );
    expect(log.some((entry) => entry.includes(PARENT_ID) && entry.startsWith("insert"))).toBe(
      false,
    );
  });

  it("publica um comentário raiz sem buscar outro comentário", async () => {
    const { route, log } = await loadTracked({
      commentSteps: [{ data: inserted(null, "Oi"), error: null }],
    });

    const response = await route.POST(post({ reviewId: REVIEW_ID, content: "Oi" }));

    expect(response.status).toBe(201);
    expect(log.filter((entry) => entry === "from:book_review_comments")).toHaveLength(1);
    expect(log).toContain(
      `insert:${JSON.stringify({
        review_id: REVIEW_ID,
        user_id: USER_ID,
        parent_id: null,
        content: "Oi",
      })}`,
    );
  });

  it("recusa pai de outra resenha e não insere", async () => {
    const { route, log } = await loadTracked({
      commentSteps: [
        {
          data: { id: PARENT_ID, review_id: OTHER_REVIEW_ID, parent_id: null },
          error: null,
        },
      ],
    });

    const response = await route.POST(
      post({ reviewId: REVIEW_ID, content: "Oi", parentId: PARENT_ID }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Comentário pai não encontrado",
    });
    expect(log.some((entry) => entry.startsWith("insert"))).toBe(false);
  });

  it("recusa pai ausente e não insere", async () => {
    const { route, log } = await loadTracked({
      commentSteps: [{ data: null, error: null }],
    });

    const response = await route.POST(
      post({ reviewId: REVIEW_ID, content: "Oi", parentId: PARENT_ID }),
    );

    expect(response.status).toBe(400);
    expect(log.some((entry) => entry.startsWith("insert"))).toBe(false);
  });

  it("retorna 404 sem resenha e não toca em comentários", async () => {
    const { route, log } = await loadTracked({ review: null });

    const response = await route.POST(post({ reviewId: REVIEW_ID, content: "Oi" }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Resenha não encontrada" });
    expect(log).not.toContain("from:book_review_comments");
    expect(log.some((entry) => entry.startsWith("insert"))).toBe(false);
  });

  it("retorna 500 na leitura da resenha e não insere", async () => {
    const { route, log } = await loadTracked({ reviewError: "falha ao ler" });

    const response = await route.POST(post({ reviewId: REVIEW_ID, content: "Oi" }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "falha ao ler" });
    expect(log).not.toContain("from:book_review_comments");
  });

  it("retorna 500 na leitura do pai e não insere", async () => {
    const { route, log } = await loadTracked({
      commentSteps: [{ data: null, error: { message: "falha no pai" } }],
    });

    const response = await route.POST(
      post({ reviewId: REVIEW_ID, content: "Oi", parentId: PARENT_ID }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "falha no pai" });
    expect(log.some((entry) => entry.startsWith("insert"))).toBe(false);
  });
});
