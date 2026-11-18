import { describe, expect, it, vi } from "vitest";

const COMMENT_ID = "550e8400-e29b-41d4-a716-446655440011";
const REVIEW_ID = "550e8400-e29b-41d4-a716-446655440010";
const AUTHOR_ID = "660e8400-e29b-41d4-a716-446655440002";
const REVIEW_AUTHOR_ID = "770e8400-e29b-41d4-a716-446655440003";
const STRANGER_ID = "880e8400-e29b-41d4-a716-446655440004";

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

async function loadRoute(userId: string) {
  vi.resetModules();
  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        }),
      },
      from: vi.fn((name: string) => {
        if (name === "book_review_comments") {
          return table({
            data: {
              id: COMMENT_ID,
              user_id: AUTHOR_ID,
              review_id: REVIEW_ID,
            },
            error: null,
          });
        }
        return table({
          data: { user_id: REVIEW_AUTHOR_ID },
          error: null,
        });
      }),
    }),
  }));
  return import("./route");
}

function remove() {
  return [
    new Request("http://localhost", { method: "DELETE" }),
    { params: Promise.resolve({ id: COMMENT_ID }) },
  ] as const;
}

describe("DELETE /api/review-comments/[id]", () => {
  it("permite o autor do comentário", async () => {
    const route = await loadRoute(AUTHOR_ID);
    const response = await route.DELETE(...remove());
    expect(response.status).toBe(200);
  });

  it("permite o autor da resenha", async () => {
    const route = await loadRoute(REVIEW_AUTHOR_ID);
    const response = await route.DELETE(...remove());
    expect(response.status).toBe(200);
  });

  it("retorna 403 para outra pessoa", async () => {
    const route = await loadRoute(STRANGER_ID);
    const response = await route.DELETE(...remove());
    expect(response.status).toBe(403);
  });
});
