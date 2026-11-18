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
