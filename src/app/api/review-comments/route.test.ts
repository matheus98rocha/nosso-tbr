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

const OTHER_REVIEW_ID = "aa0e8400-e29b-41d4-a716-446655440099";

type QueryCall = {
  table: string;
  op: string;
  filters: Array<[string, unknown]>;
  payload?: unknown;
};

function recordingTable(
  calls: QueryCall[],
  name: string,
  resultFor: (op: string) => { data: unknown; error: { message: string } | null },
) {
  let op = "select";
  const filters: Array<[string, unknown]> = [];
  let payload: unknown;
  const proxy: object = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "then") {
          return (
            onFulfilled?: (value: unknown) => unknown,
            onRejected?: (reason: unknown) => unknown,
          ) => {
            calls.push({ table: name, op, filters: [...filters], payload });
            return Promise.resolve(resultFor(op)).then(onFulfilled, onRejected);
          };
        }
        return (...args: unknown[]) => {
          if (prop === "insert" || prop === "delete" || prop === "upsert") {
            op = String(prop);
            payload = args[0];
          } else if (prop === "eq") {
            filters.push([String(args[0]), args[1]]);
          }
          return proxy;
        };
      },
    },
  );
  return proxy;
}

async function loadRecordingRoute(options: {
  review?: { id: string } | null;
  reviewError?: string;
  parent?: { id: string; review_id: string; parent_id: string | null } | null;
}) {
  vi.resetModules();
  const calls: QueryCall[] = [];
  const client = {
    calls,
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: USER_ID } },
        error: null,
      }),
    },
    from: vi.fn((name: string) =>
      recordingTable(calls, name, (op) => {
        if (name === "book_reviews") {
          if (options.reviewError) {
            return { data: null, error: { message: options.reviewError } };
          }
          const review = options.review === undefined ? { id: REVIEW_ID } : options.review;
          return { data: review, error: null };
        }
        if (op === "insert") {
          return {
            data: {
              id: "comment-new",
              review_id: REVIEW_ID,
              user_id: USER_ID,
              parent_id: ROOT_ID,
              content: "Concordo",
              created_at: "2026-11-18T00:00:00.000Z",
            },
            error: null,
          };
        }
        const parent =
          options.parent === undefined
            ? { id: PARENT_ID, review_id: REVIEW_ID, parent_id: ROOT_ID }
            : options.parent;
        return { data: parent, error: null };
      }),
    ),
  };
  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue(client),
  }));
  return { route: await import("./route"), client };
}

function post(body: unknown) {
  return new Request("http://localhost/api/review-comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/review-comments threading", () => {
  it("grava a resposta de uma resposta no comentário raiz", async () => {
    const { route, client } = await loadRecordingRoute({});
    const response = await route.POST(
      post({ reviewId: REVIEW_ID, content: "  Concordo  ", parentId: PARENT_ID }),
    );

    expect(response.status).toBe(201);
    expect(client.calls.filter((call) => call.op === "insert")).toEqual([
      {
        table: "book_review_comments",
        op: "insert",
        filters: [],
        payload: {
          review_id: REVIEW_ID,
          user_id: USER_ID,
          parent_id: ROOT_ID,
          content: "Concordo",
        },
      },
    ]);
  });

  it("recusa pai de outra resenha e não insere", async () => {
    const { route, client } = await loadRecordingRoute({
      parent: { id: PARENT_ID, review_id: OTHER_REVIEW_ID, parent_id: null },
    });
    const response = await route.POST(
      post({ reviewId: REVIEW_ID, content: "Concordo", parentId: PARENT_ID }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Comentário pai não encontrado",
    });
    expect(client.calls.filter((call) => call.op === "insert")).toEqual([]);
  });

  it("retorna 404 quando a resenha não existe e não chega nos comentários", async () => {
    const { route, client } = await loadRecordingRoute({ review: null });
    const response = await route.POST(post({ reviewId: REVIEW_ID, content: "Concordo" }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Resenha não encontrada" });
    expect(client.calls.map((call) => call.table)).toEqual(["book_reviews"]);
  });

  it("retorna 500 na leitura da resenha e não insere", async () => {
    const { route, client } = await loadRecordingRoute({ reviewError: "review down" });
    const response = await route.POST(post({ reviewId: REVIEW_ID, content: "Concordo" }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "review down" });
    expect(client.calls.filter((call) => call.op === "insert")).toEqual([]);
  });
});
