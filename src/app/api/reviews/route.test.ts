import { describe, expect, it, vi } from "vitest";

const BOOK_ID = "550e8400-e29b-41d4-a716-446655440001";
const USER_ID = "660e8400-e29b-41d4-a716-446655440002";
const OTHER_ID = "770e8400-e29b-41d4-a716-446655440003";

type QueryCall = {
  table: string;
  op: string;
  filters: Array<[string, unknown]>;
};

function table(
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
          if (prop === "upsert" || prop === "delete" || prop === "insert") {
            op = prop;
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

function clientFor(options: {
  userId?: string | null;
  book?: Record<string, unknown> | null;
  reviewId?: string;
  ratingError?: string | null;
  reviewDeleteError?: string | null;
}) {
  const userId = options.userId === undefined ? USER_ID : options.userId;
  const calls: QueryCall[] = [];
  const book =
    options.book === undefined
      ? {
          status: "finished",
          user_id: USER_ID,
          chosen_by: USER_ID,
          readers: [USER_ID],
        }
      : options.book;
  return {
    calls,
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
        error: null,
      }),
    },
    from: vi.fn((name: string) =>
      table(calls, name, (op) => {
        if (name === "books") return { data: book, error: null };
        if (name === "book_reviews" && op === "delete") {
          return {
            data: null,
            error: options.reviewDeleteError
              ? { message: options.reviewDeleteError }
              : null,
          };
        }
        if (name === "book_reviews") {
          return { data: { id: options.reviewId ?? "review-1" }, error: null };
        }
        if (name === "book_reading_ratings") {
          return {
            data: null,
            error: options.ratingError ? { message: options.ratingError } : null,
          };
        }
        return { data: null, error: null };
      }),
    ),
  };
}

async function loadRoute(client: ReturnType<typeof clientFor>) {
  vi.resetModules();
  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue(client),
  }));
  return import("./route");
}

function put(body: unknown) {
  return new Request("http://localhost/api/reviews", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PUT /api/reviews", () => {
  it("retorna 401 sem sessão", async () => {
    const client = clientFor({ userId: null });
    const route = await loadRoute(client);
    const response = await route.PUT(put({ bookId: BOOK_ID, stars: 5, content: "Oi" }));
    expect(response.status).toBe(401);
    expect(client.from).not.toHaveBeenCalled();
  });

  it("retorna 400 com corpo inválido", async () => {
    const client = clientFor({});
    const route = await loadRoute(client);
    const response = await route.PUT(put({ bookId: BOOK_ID, stars: 9 }));
    expect(response.status).toBe(400);
  });

  it("retorna 403 quando a pessoa não participa do livro", async () => {
    const client = clientFor({
      book: {
        status: "reading",
        user_id: OTHER_ID,
        chosen_by: OTHER_ID,
        readers: [OTHER_ID],
      },
    });
    const route = await loadRoute(client);
    const response = await route.PUT(
      put({ bookId: BOOK_ID, stars: 4, content: "Texto" }),
    );
    expect(response.status).toBe(403);
  });

  it("retorna 400 sem texto quando o livro não está finalizado", async () => {
    const client = clientFor({
      book: {
        status: "reading",
        user_id: USER_ID,
        chosen_by: USER_ID,
        readers: [USER_ID],
      },
    });
    const route = await loadRoute(client);
    const response = await route.PUT(put({ bookId: BOOK_ID, stars: 4, content: "   " }));
    expect(response.status).toBe(400);
  });

  it("publica a resenha e grava as estrelas quando o livro está finalizado", async () => {
    const client = clientFor({});
    const route = await loadRoute(client);
    const response = await route.PUT(
      put({ bookId: BOOK_ID, stars: 5, content: "  Valeu a leitura  " }),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      published: true,
      reviewId: "review-1",
      stars: 5,
    });
    expect(client.calls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ table: "book_reviews", op: "upsert" }),
        expect.objectContaining({ table: "book_reading_ratings", op: "upsert" }),
      ]),
    );
    expect(client.calls.some((call) => call.op === "delete")).toBe(false);
  });

  it("salva só a avaliação quando a finalização vem sem texto", async () => {
    const client = clientFor({});
    const route = await loadRoute(client);
    const response = await route.PUT(put({ bookId: BOOK_ID, stars: 3, content: "   " }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      published: false,
      reviewId: null,
      stars: 3,
    });
    expect(client.calls.filter((call) => call.table === "book_reviews")).toEqual([
      {
        table: "book_reviews",
        op: "delete",
        filters: [
          ["user_id", USER_ID],
          ["book_id", BOOK_ID],
        ],
      },
    ]);
    const ratingIndex = client.calls.findIndex(
      (call) => call.table === "book_reading_ratings" && call.op === "upsert",
    );
    const deleteIndex = client.calls.findIndex(
      (call) => call.table === "book_reviews" && call.op === "delete",
    );
    expect(ratingIndex).toBeGreaterThanOrEqual(0);
    expect(deleteIndex).toBeGreaterThan(ratingIndex);
  });

  it("mantém a resenha publicada se a avaliação privada falha", async () => {
    const client = clientFor({ ratingError: "rating down" });
    const route = await loadRoute(client);
    const response = await route.PUT(put({ bookId: BOOK_ID, stars: 3, content: "" }));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "rating down" });
    expect(client.calls.some((call) => call.op === "delete")).toBe(false);
  });

  it("retorna 500 quando a resenha antiga não sai depois das estrelas", async () => {
    const client = clientFor({ reviewDeleteError: "delete down" });
    const route = await loadRoute(client);
    const response = await route.PUT(put({ bookId: BOOK_ID, stars: 3, content: "" }));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "delete down" });
    expect(
      client.calls.some(
        (call) => call.table === "book_reading_ratings" && call.op === "upsert",
      ),
    ).toBe(true);
  });
});
