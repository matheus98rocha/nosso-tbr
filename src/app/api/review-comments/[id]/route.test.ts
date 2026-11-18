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

function chain(result: { data: unknown; error: unknown }, log: string[]) {
  const promise = Promise.resolve(result);
  const proxy: object = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "then") return promise.then.bind(promise);
        return (...args: unknown[]) => {
          log.push(`${String(prop)}:${args.map(String).join(",")}`);
          return proxy;
        };
      },
    },
  );
  return proxy;
}

async function loadTracked(options: {
  userId?: string | null;
  steps?: Array<{ data: unknown; error: { message: string } | null }>;
}) {
  const log: string[] = [];
  const userId = options.userId === undefined ? AUTHOR_ID : options.userId;
  const steps = options.steps ?? [
    {
      data: { id: COMMENT_ID, user_id: AUTHOR_ID, review_id: REVIEW_ID },
      error: null,
    },
    { data: { user_id: REVIEW_AUTHOR_ID }, error: null },
    { data: null, error: null },
  ];
  let call = 0;
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
        const result = steps[call] ?? { data: null, error: null };
        call += 1;
        return chain(result, log);
      }),
    }),
  }));
  return { route: await import("./route"), log };
}

describe("DELETE /api/review-comments/[id] guardas", () => {
  it("retorna 401 sem sessão e não consulta", async () => {
    const { route, log } = await loadTracked({ userId: null });
    const response = await route.DELETE(...remove());

    expect(response.status).toBe(401);
    expect(log).not.toContain("from:book_review_comments");
    expect(log.some((entry) => entry.startsWith("delete"))).toBe(false);
  });

  it("retorna 404 e não apaga quando o comentário não existe", async () => {
    const { route, log } = await loadTracked({
      steps: [{ data: null, error: null }],
    });
    const response = await route.DELETE(...remove());

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Comentário não encontrado",
    });
    expect(log.some((entry) => entry.startsWith("delete"))).toBe(false);
  });

  it("retorna 500 na leitura do comentário e não apaga", async () => {
    const { route, log } = await loadTracked({
      steps: [{ data: null, error: { message: "falha ao ler" } }],
    });
    const response = await route.DELETE(...remove());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "falha ao ler" });
    expect(log.some((entry) => entry.startsWith("delete"))).toBe(false);
  });

  it("retorna 500 na leitura da resenha e não apaga", async () => {
    const { route, log } = await loadTracked({
      steps: [
        {
          data: { id: COMMENT_ID, user_id: AUTHOR_ID, review_id: REVIEW_ID },
          error: null,
        },
        { data: null, error: { message: "falha na resenha" } },
      ],
    });
    const response = await route.DELETE(...remove());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "falha na resenha" });
    expect(log).toContain("from:book_reviews");
    expect(log.filter((entry) => entry === "from:book_review_comments")).toHaveLength(1);
    expect(log.some((entry) => entry.startsWith("delete"))).toBe(false);
  });

  it("retorna 403 e não apaga o comentário de outra pessoa", async () => {
    const { route, log } = await loadTracked({ userId: STRANGER_ID });
    const response = await route.DELETE(...remove());

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
    expect(log.some((entry) => entry.startsWith("delete"))).toBe(false);
    expect(log.filter((entry) => entry === "from:book_review_comments")).toHaveLength(1);
  });
});
