import { describe, expect, it, vi } from "vitest";

const BOOK_ID = "550e8400-e29b-41d4-a716-446655440001";
const USER_ID = "660e8400-e29b-41d4-a716-446655440002";
const OTHER_ID = "770e8400-e29b-41d4-a716-446655440003";

function table(result: { data: unknown; error: unknown }) {
  const promise = Promise.resolve(result);
  const proxy: object = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "then") {
          return promise.then.bind(promise);
        }
        return () => proxy;
      },
    },
  );
  return proxy;
}

function clientFor(options: {
  userId?: string | null;
  book?: Record<string, unknown> | null;
  reviewId?: string;
}) {
  const userId = options.userId === undefined ? USER_ID : options.userId;
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
        error: null,
      }),
    },
    from: vi.fn((name: string) => {
      if (name === "books") {
        return table({
          data:
            options.book === undefined
              ? {
                  status: "finished",
                  user_id: USER_ID,
                  chosen_by: USER_ID,
                  readers: [USER_ID],
                }
              : options.book,
          error: null,
        });
      }
      if (name === "book_reviews") {
        return table({ data: { id: options.reviewId ?? "review-1" }, error: null });
      }
      return table({ data: null, error: null });
    }),
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
    expect(client.from).toHaveBeenCalledWith("book_reviews");
    expect(client.from).toHaveBeenCalledWith("book_reading_ratings");
  });

  it("salva só a avaliação quando a finalização vem sem texto", async () => {
    const client = clientFor({});
    const route = await loadRoute(client);
    const response = await route.PUT(put({ bookId: BOOK_ID, stars: 3, content: "" }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      published: false,
      reviewId: null,
      stars: 3,
    });
    expect(client.from).not.toHaveBeenCalledWith("book_reviews");
    expect(client.from).toHaveBeenCalledWith("book_reading_ratings");
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

function loggedClient(options: {
  userId?: string | null;
  book?: Record<string, unknown> | null;
  bookError?: string | null;
  reviewError?: string | null;
  ratingError?: string | null;
}) {
  const log: string[] = [];
  const userId = options.userId === undefined ? USER_ID : options.userId;
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
        if (name === "books") {
          return chain(
            {
              data: options.bookError ? null : book,
              error: options.bookError ? { message: options.bookError } : null,
            },
            log,
          );
        }
        if (name === "book_reviews") {
          return chain(
            {
              data: options.reviewError ? null : { id: "review-1" },
              error: options.reviewError ? { message: options.reviewError } : null,
            },
            log,
          );
        }
        return chain(
          {
            data: null,
            error: options.ratingError ? { message: options.ratingError } : null,
          },
          log,
        );
      }),
    },
  };
}

function tables(log: string[]) {
  return log.filter((entry) => entry.startsWith("from:"));
}

describe("PUT /api/reviews writes", () => {
  it("não consulta com JSON inválido nem com texto acima de 500", async () => {
    const invalid = loggedClient({});
    const invalidRoute = await loadRoute(invalid.client);
    const invalidResponse = await invalidRoute.PUT(
      new Request("http://localhost/api/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: "{",
      }),
    );
    expect(invalidResponse.status).toBe(400);
    expect(invalid.log).toEqual([]);

    const tooLong = loggedClient({});
    const longRoute = await loadRoute(tooLong.client);
    const longResponse = await longRoute.PUT(
      put({ bookId: BOOK_ID, stars: 5, content: "a".repeat(501) }),
    );
    expect(longResponse.status).toBe(400);
    expect(tooLong.log).toEqual([]);
  });

  it("retorna 404 sem livro e só lê a tabela de livros", async () => {
    const { client, log } = loggedClient({ book: null });
    const route = await loadRoute(client);
    const response = await route.PUT(put({ bookId: BOOK_ID, stars: 4, content: "Texto" }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Livro não encontrado" });
    expect(tables(log)).toEqual(["from:books"]);
  });

  it("não grava quando a leitura do livro falha", async () => {
    const { client, log } = loggedClient({ bookError: "falha ao ler" });
    const route = await loadRoute(client);
    const response = await route.PUT(put({ bookId: BOOK_ID, stars: 4, content: "Texto" }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "falha ao ler" });
    expect(tables(log)).toEqual(["from:books"]);
  });

  it("publica resenha em andamento sem gravar estrelas da avaliação", async () => {
    const { client, log } = loggedClient({
      book: {
        status: "reading",
        user_id: USER_ID,
        chosen_by: USER_ID,
        readers: [USER_ID],
      },
    });
    const route = await loadRoute(client);
    const response = await route.PUT(put({ bookId: BOOK_ID, stars: 4, content: "Texto" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      published: true,
      reviewId: "review-1",
      stars: 4,
    });
    expect(tables(log)).toEqual(["from:books", "from:book_reviews"]);
  });

  it("publica quando a pessoa é a responsável e não está em readers", async () => {
    const { client, log } = loggedClient({
      book: {
        status: "reading",
        user_id: OTHER_ID,
        chosen_by: USER_ID,
        readers: [OTHER_ID],
      },
    });
    const route = await loadRoute(client);
    const response = await route.PUT(put({ bookId: BOOK_ID, stars: 2, content: "Texto" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ published: true, reviewId: "review-1" });
    expect(tables(log)).toEqual(["from:books", "from:book_reviews"]);
  });

  it("publica para quem cadastrou o livro mesmo com readers nulo", async () => {
    const { client, log } = loggedClient({
      book: {
        status: "paused",
        user_id: USER_ID,
        chosen_by: null,
        readers: null,
      },
    });
    const route = await loadRoute(client);
    const response = await route.PUT(put({ bookId: BOOK_ID, stars: 3, content: "Texto" }));

    expect(response.status).toBe(200);
    expect(tables(log)).toEqual(["from:books", "from:book_reviews"]);
  });

  it("recusa quem está fora do livro mesmo com readers nulo", async () => {
    const { client, log } = loggedClient({
      book: {
        status: "reading",
        user_id: OTHER_ID,
        chosen_by: OTHER_ID,
        readers: null,
      },
    });
    const route = await loadRoute(client);
    const response = await route.PUT(put({ bookId: BOOK_ID, stars: 3, content: "Texto" }));

    expect(response.status).toBe(403);
    expect(tables(log)).toEqual(["from:books"]);
    expect(log.some((entry) => entry.startsWith("upsert") || entry.startsWith("delete"))).toBe(
      false,
    );
  });

  it("não grava estrelas quando a resenha falha", async () => {
    const { client, log } = loggedClient({ reviewError: "falha na resenha" });
    const route = await loadRoute(client);
    const response = await route.PUT(put({ bookId: BOOK_ID, stars: 5, content: "Texto" }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "falha na resenha" });
    expect(tables(log)).toEqual(["from:books", "from:book_reviews"]);
    expect(log.some((entry) => entry.startsWith("delete"))).toBe(false);
  });

  it("devolve 500 se as estrelas falham e não apaga a resenha", async () => {
    const { client, log } = loggedClient({ ratingError: "falha nas estrelas" });
    const route = await loadRoute(client);
    const response = await route.PUT(put({ bookId: BOOK_ID, stars: 5, content: "Texto" }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "falha nas estrelas" });
    expect(tables(log)).toEqual([
      "from:books",
      "from:book_reviews",
      "from:book_reading_ratings",
    ]);
    expect(log.some((entry) => entry.startsWith("delete"))).toBe(false);
  });
});
