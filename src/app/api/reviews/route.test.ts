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

  it("recusa a nota quando a leitura não está finalizada", async () => {
    const client = clientFor({
      book: {
        status: "reading",
        user_id: USER_ID,
        chosen_by: USER_ID,
        readers: [USER_ID],
      },
    });
    const route = await loadRoute(client);
    const response = await route.PUT(put({ bookId: BOOK_ID, stars: 4, content: "Texto" }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "As estrelas ficam disponíveis quando a leitura está finalizada.",
    });
    expect(client.from).not.toHaveBeenCalledWith("book_reviews");
    expect(client.from).not.toHaveBeenCalledWith("book_reading_ratings");
  });

  it("recusa a nota em qualquer status que não seja leitura finalizada", async () => {
    const statuses: Array<string | null> = [
      "paused",
      "abandoned",
      "planned",
      "not_started",
      "Finished",
      "",
      null,
    ];

    for (const status of statuses) {
      const client = clientFor({
        book: {
          status,
          user_id: USER_ID,
          chosen_by: USER_ID,
          readers: [USER_ID],
        },
      });
      const route = await loadRoute(client);
      const response = await route.PUT(put({ bookId: BOOK_ID, stars: 4, content: "Texto" }));
      expect(response.status, `status ${String(status)}`).toBe(400);
      await expect(response.json()).resolves.toMatchObject({
        error: "As estrelas ficam disponíveis quando a leitura está finalizada.",
      });
      expect(client.from).not.toHaveBeenCalledWith("book_reviews");
      expect(client.from).not.toHaveBeenCalledWith("book_reading_ratings");
    }
  });

  it("recusa a nota mesmo com texto em branco quando a leitura não terminou", async () => {
    const client = clientFor({
      book: {
        status: "paused",
        user_id: USER_ID,
        chosen_by: USER_ID,
        readers: [USER_ID],
      },
    });
    const route = await loadRoute(client);
    const response = await route.PUT(put({ bookId: BOOK_ID, stars: 4, content: "   " }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "As estrelas ficam disponíveis quando a leitura está finalizada.",
    });
    expect(client.from).not.toHaveBeenCalledWith("book_reviews");
    expect(client.from).not.toHaveBeenCalledWith("book_reading_ratings");
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

  it("não publica resenha em branco quando a leitura está finalizada", async () => {
    const client = clientFor({});
    const route = await loadRoute(client);
    const response = await route.PUT(put({ bookId: BOOK_ID, stars: 2, content: "   " }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      published: false,
      reviewId: null,
      stars: 2,
    });
    expect(client.from).not.toHaveBeenCalledWith("book_reviews");
    expect(client.from).toHaveBeenCalledWith("book_reading_ratings");
  });
});
