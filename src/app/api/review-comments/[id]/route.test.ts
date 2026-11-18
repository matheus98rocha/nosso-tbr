import { describe, expect, it, vi } from "vitest";

const COMMENT_ID = "550e8400-e29b-41d4-a716-446655440011";
const REVIEW_ID = "550e8400-e29b-41d4-a716-446655440010";
const AUTHOR_ID = "660e8400-e29b-41d4-a716-446655440002";
const REVIEW_AUTHOR_ID = "770e8400-e29b-41d4-a716-446655440003";
const STRANGER_ID = "880e8400-e29b-41d4-a716-446655440004";

async function loadRoute(
  userId: string | null,
  found: { data: unknown; error: { message: string } | null } = {
    data: {
      id: COMMENT_ID,
      user_id: AUTHOR_ID,
      review_id: REVIEW_ID,
    },
    error: null,
  },
) {
  vi.resetModules();
  const ops: string[] = [];
  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
        error: null,
      }),
    },
    from: vi.fn((name: string) => {
      const result = name === "book_review_comments" ? found : {
        data: { user_id: REVIEW_AUTHOR_ID },
        error: null,
      };
      const promise = Promise.resolve(result);
      const proxy: object = new Proxy(
        {},
        {
          get(_target, prop) {
            if (prop === "then") return promise.then.bind(promise);
            return () => {
              if (name === "book_review_comments" && prop === "delete") ops.push("delete");
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
  return { route: await import("./route"), client, ops };
}

function remove() {
  return [
    new Request("http://localhost", { method: "DELETE" }),
    { params: Promise.resolve({ id: COMMENT_ID }) },
  ] as const;
}

describe("DELETE /api/review-comments/[id]", () => {
  it("permite o autor do comentário", async () => {
    const { route } = await loadRoute(AUTHOR_ID);
    const response = await route.DELETE(...remove());
    expect(response.status).toBe(200);
  });

  it("permite o autor da resenha", async () => {
    const { route } = await loadRoute(REVIEW_AUTHOR_ID);
    const response = await route.DELETE(...remove());
    expect(response.status).toBe(200);
  });

  it("retorna 403 para outra pessoa", async () => {
    const { route, ops } = await loadRoute(STRANGER_ID);
    const response = await route.DELETE(...remove());
    expect(response.status).toBe(403);
    expect(ops).not.toContain("delete");
  });

  it("retorna 401 sem sessão e não consulta o comentário", async () => {
    const { route, client } = await loadRoute(null);
    const response = await route.DELETE(...remove());
    expect(response.status).toBe(401);
    expect(client.from).not.toHaveBeenCalled();
  });

  it("retorna 404 quando o comentário não existe e não apaga", async () => {
    const { route, client, ops } = await loadRoute(AUTHOR_ID, { data: null, error: null });
    const response = await route.DELETE(...remove());
    expect(response.status).toBe(404);
    expect(client.from).not.toHaveBeenCalledWith("book_reviews");
    expect(ops).not.toContain("delete");
  });
});
