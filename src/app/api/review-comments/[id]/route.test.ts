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

type QueryCall = {
  table: string;
  op: string;
  filters: Array<[string, unknown]>;
};

function recordingTable(
  calls: QueryCall[],
  name: string,
  resultFor: (op: string) => { data: unknown; error: { message: string } | null },
) {
  let op = "select";
  const filters: Array<[string, unknown]> = [];
  const proxy: object = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "then") {
          return (
            onFulfilled?: (value: unknown) => unknown,
            onRejected?: (reason: unknown) => unknown,
          ) => {
            calls.push({ table: name, op, filters: [...filters] });
            return Promise.resolve(resultFor(op)).then(onFulfilled, onRejected);
          };
        }
        return (...args: unknown[]) => {
          if (prop === "delete" || prop === "insert" || prop === "upsert") op = String(prop);
          if (prop === "eq") filters.push([String(args[0]), args[1]]);
          return proxy;
        };
      },
    },
  );
  return proxy;
}

function clientFor(options: {
  userId?: string | null;
  comment?: { id: string; user_id: string; review_id: string } | null;
  findError?: string;
  reviewError?: string;
}) {
  const userId = options.userId === undefined ? AUTHOR_ID : options.userId;
  const calls: QueryCall[] = [];
  const comment =
    options.comment === undefined
      ? { id: COMMENT_ID, user_id: AUTHOR_ID, review_id: REVIEW_ID }
      : options.comment;
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
        if (name === "book_review_comments" && op === "select") {
          if (options.findError) return { data: null, error: { message: options.findError } };
          return { data: comment, error: null };
        }
        if (name === "book_reviews") {
          if (options.reviewError) {
            return { data: null, error: { message: options.reviewError } };
          }
          return { data: { user_id: REVIEW_AUTHOR_ID }, error: null };
        }
        return { data: null, error: null };
      }),
    ),
  };
}

async function loadRecordingRoute(client: ReturnType<typeof clientFor>) {
  vi.resetModules();
  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue(client),
  }));
  return import("./route");
}

function deleted(calls: QueryCall[]) {
  return calls.filter((call) => call.op === "delete");
}

describe("DELETE /api/review-comments/[id] fail closed", () => {
  it("retorna 401 sem sessão e não consulta o comentário", async () => {
    const client = clientFor({ userId: null });
    const route = await loadRecordingRoute(client);
    const response = await route.DELETE(...remove());
    expect(response.status).toBe(401);
    expect(client.from).not.toHaveBeenCalled();
  });

  it("retorna 404 quando o comentário não existe e não apaga", async () => {
    const client = clientFor({ comment: null });
    const route = await loadRecordingRoute(client);
    const response = await route.DELETE(...remove());
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Comentário não encontrado" });
    expect(deleted(client.calls)).toEqual([]);
  });

  it("retorna 500 na leitura do comentário e não apaga", async () => {
    const client = clientFor({ findError: "find down" });
    const route = await loadRecordingRoute(client);
    const response = await route.DELETE(...remove());
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "find down" });
    expect(deleted(client.calls)).toEqual([]);
  });

  it("retorna 500 na leitura da resenha e não apaga", async () => {
    const client = clientFor({ reviewError: "review down" });
    const route = await loadRecordingRoute(client);
    const response = await route.DELETE(...remove());
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "review down" });
    expect(deleted(client.calls)).toEqual([]);
  });

  it("não apaga quando outra pessoa tenta excluir", async () => {
    const client = clientFor({ userId: STRANGER_ID });
    const route = await loadRecordingRoute(client);
    const response = await route.DELETE(...remove());
    expect(response.status).toBe(403);
    expect(deleted(client.calls)).toEqual([]);
  });
});
