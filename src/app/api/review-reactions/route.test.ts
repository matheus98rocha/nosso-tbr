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
          if (prop === "upsert" || prop === "delete" || prop === "insert") {
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

function reactionClient(options: {
  userId?: string | null;
  review?: { id: string; user_id: string } | null;
  rows?: Array<{ user_id: string; reaction: string }>;
}) {
  const userId = options.userId === undefined ? USER_ID : options.userId;
  const review =
    options.review === undefined
      ? { id: REVIEW_ID, user_id: AUTHOR_ID }
      : options.review;
  const calls: QueryCall[] = [];
  return {
    calls,
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
        error: null,
      }),
    },
    from: vi.fn((name: string) =>
      recordingTable(calls, name, (op) => {
        if (name === "book_reviews") return { data: review, error: null };
        if (op === "select") {
          return { data: options.rows ?? [], error: null };
        }
        return { data: null, error: null };
      }),
    ),
  };
}

async function loadRecordingRoute(client: ReturnType<typeof reactionClient>) {
  vi.resetModules();
  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue(client),
  }));
  return import("./route");
}

function writes(calls: QueryCall[]) {
  return calls.filter((call) => call.op === "upsert" || call.op === "delete");
}

describe("POST /api/review-reactions writes", () => {
  it("não grava quando a resenha não existe", async () => {
    const client = reactionClient({ review: null });
    const route = await loadRecordingRoute(client);
    const response = await route.POST(post({ reviewId: REVIEW_ID, reaction: "like" }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Resenha não encontrada" });
    expect(writes(client.calls)).toEqual([]);
  });

  it("não grava na própria resenha", async () => {
    const client = reactionClient({
      userId: AUTHOR_ID,
      review: { id: REVIEW_ID, user_id: AUTHOR_ID },
    });
    const route = await loadRecordingRoute(client);
    const response = await route.POST(post({ reviewId: REVIEW_ID, reaction: "dislike" }));

    expect(response.status).toBe(403);
    expect(writes(client.calls)).toEqual([]);
  });

  it("remove só a reação de quem chama e ignora reação desconhecida na contagem", async () => {
    const client = reactionClient({
      rows: [
        { user_id: AUTHOR_ID, reaction: "like" },
        { user_id: USER_ID, reaction: "nope" },
        { user_id: "880e8400-e29b-41d4-a716-446655440004", reaction: "dislike" },
        { user_id: "990e8400-e29b-41d4-a716-446655440005", reaction: "like" },
      ],
    });
    const route = await loadRecordingRoute(client);
    const response = await route.POST(post({ reviewId: REVIEW_ID, reaction: null }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      reviewId: REVIEW_ID,
      likeCount: 2,
      dislikeCount: 1,
      userReaction: null,
    });
    expect(writes(client.calls)).toEqual([
      {
        table: "book_review_reactions",
        op: "delete",
        filters: [
          ["review_id", REVIEW_ID],
          ["user_id", USER_ID],
        ],
        payload: undefined,
      },
    ]);
  });
});
