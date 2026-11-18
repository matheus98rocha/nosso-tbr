import { describe, expect, it, vi } from "vitest";

const REVIEW_ID = "550e8400-e29b-41d4-a716-446655440010";
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

const OTHER_REVIEW_ID = "550e8400-e29b-41d4-a716-446655440099";

function postComment(body: unknown) {
  return new Request("http://localhost/api/review-comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function loadCommentRoute(options: {
  review?: { id: string } | null;
  parent?: { id: string; review_id: string; parent_id: string | null } | null;
}) {
  vi.resetModules();
  const writes: { op: string; payload: unknown }[] = [];
  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: USER_ID } },
        error: null,
      }),
    },
    from: vi.fn((name: string) => {
      let op = "select";
      let payload: unknown;
      const proxy: object = new Proxy(
        {},
        {
          get(_target, prop) {
            if (prop === "then") {
              const result = (() => {
                if (name === "book_reviews") {
                  return {
                    data: options.review === undefined ? { id: REVIEW_ID } : options.review,
                    error: null,
                  };
                }
                if (op === "insert") {
                  writes.push({ op, payload });
                  return {
                    data: {
                      id: "comment-1",
                      created_at: "2026-11-18T00:00:00.000Z",
                      ...(payload as Record<string, unknown>),
                    },
                    error: null,
                  };
                }
                return {
                  data: options.parent === undefined ? null : options.parent,
                  error: null,
                };
              })();
              const promise = Promise.resolve(result);
              return promise.then.bind(promise);
            }
            return (next?: unknown) => {
              if (prop === "insert" || prop === "upsert" || prop === "delete") {
                op = String(prop);
                payload = next;
              }
              return proxy;
            };
          },
        },
      );
      return proxy;
    }),
  };
  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue(client),
  }));
  return { route: await import("./route"), client, writes };
}

describe("POST /api/review-comments — resposta e resenha", () => {
  it("responde a uma resposta no comentário raiz", async () => {
    const { route, writes } = await loadCommentRoute({
      parent: { id: PARENT_ID, review_id: REVIEW_ID, parent_id: ROOT_ID },
    });
    const response = await route.POST(
      postComment({ reviewId: REVIEW_ID, content: "  Também acho  ", parentId: PARENT_ID }),
    );
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      parent_id: ROOT_ID,
      content: "Também acho",
      review_id: REVIEW_ID,
    });
    expect(writes).toEqual([
      {
        op: "insert",
        payload: {
          review_id: REVIEW_ID,
          user_id: USER_ID,
          parent_id: ROOT_ID,
          content: "Também acho",
        },
      },
    ]);
  });

  it("mantém o comentário raiz quando a resposta é direta", async () => {
    const { route, writes } = await loadCommentRoute({
      parent: { id: PARENT_ID, review_id: REVIEW_ID, parent_id: null },
    });
    const response = await route.POST(
      postComment({ reviewId: REVIEW_ID, content: "Direto", parentId: PARENT_ID }),
    );
    expect(response.status).toBe(201);
    expect(writes[0]?.payload).toMatchObject({ parent_id: PARENT_ID });
  });

  it("recusa pai de outra resenha e não grava", async () => {
    const { route, writes } = await loadCommentRoute({
      parent: { id: PARENT_ID, review_id: OTHER_REVIEW_ID, parent_id: null },
    });
    const response = await route.POST(
      postComment({ reviewId: REVIEW_ID, content: "Fora", parentId: PARENT_ID }),
    );
    expect(response.status).toBe(400);
    expect(writes).toEqual([]);
  });

  it("retorna 404 quando a resenha não existe", async () => {
    const { route, client, writes } = await loadCommentRoute({ review: null });
    const response = await route.POST(postComment({ reviewId: REVIEW_ID, content: "Oi" }));
    expect(response.status).toBe(404);
    expect(client.from).not.toHaveBeenCalledWith("book_review_comments");
    expect(writes).toEqual([]);
  });
});
