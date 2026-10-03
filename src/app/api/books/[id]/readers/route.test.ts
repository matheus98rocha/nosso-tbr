import { describe, expect, it, vi } from "vitest";

type Query = Record<string, ReturnType<typeof vi.fn>>;

type Client = {
  auth: { getUser: ReturnType<typeof vi.fn> };
  from: ReturnType<typeof vi.fn>;
};

const ME = "11111111-1111-4111-8111-111111111111";
const BIA = "22222222-2222-4222-8222-222222222222";

function authLogged(userId: string): Client["auth"] {
  return {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    }),
  };
}

function chain(resolved: unknown): Query {
  const query: Query = {};
  const self = () => query;

  for (const method of ["select", "eq", "update"]) {
    query[method] = vi.fn(self);
  }

  query.single = vi.fn().mockResolvedValue(resolved);
  query.maybeSingle = vi.fn().mockResolvedValue(resolved);

  return query;
}

async function loadRoute(client: Client) {
  vi.resetModules();
  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue(client),
  }));

  return import("./route");
}

function post(userId: string) {
  return new Request("http://localhost/api/books/book-1/readers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
}

describe("POST /api/books/[id]/readers", () => {
  it("retorna 401 quando não autenticado", async () => {
    const client: Client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
      from: vi.fn(),
    };
    const route = await loadRoute(client);
    const response = await route.POST(post(BIA), {
      params: Promise.resolve({ id: "book-1" }),
    });

    expect(response.status).toBe(401);
    expect(client.from).not.toHaveBeenCalled();
  });

  it("recusa adicionar alguém que não é seguido", async () => {
    const books = chain({
      data: {
        id: "book-1",
        user_id: ME,
        chosen_by: null,
        readers: [ME],
      },
      error: null,
    });
    const follows = chain({ data: null, error: null });
    const client: Client = {
      auth: authLogged(ME),
      from: vi.fn((table: string) => {
        if (table === "books") return books;
        if (table === "user_followers") return follows;
        throw new Error(table);
      }),
    };
    const route = await loadRoute(client);
    const response = await route.POST(post(BIA), {
      params: Promise.resolve({ id: "book-1" }),
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "Você só pode adicionar pessoas que segue",
    });
    expect(books.update).not.toHaveBeenCalled();
  });

  it("inclui a pessoa seguida em readers sem duplicar os atuais", async () => {
    const booksSelect = chain({
      data: {
        id: "book-1",
        user_id: ME,
        chosen_by: null,
        readers: [ME],
      },
      error: null,
    });
    const booksUpdate = chain({ error: null });
    let bookCalls = 0;
    const follows = chain({
      data: { following_id: BIA },
      error: null,
    });
    const client: Client = {
      auth: authLogged(ME),
      from: vi.fn((table: string) => {
        if (table === "user_followers") return follows;
        bookCalls += 1;
        return bookCalls === 1 ? booksSelect : booksUpdate;
      }),
    };
    const route = await loadRoute(client);
    const response = await route.POST(post(BIA), {
      params: Promise.resolve({ id: "book-1" }),
    });

    expect(response.status).toBe(200);
    expect(follows.eq).toHaveBeenCalledWith("follower_id", ME);
    expect(follows.eq).toHaveBeenCalledWith("following_id", BIA);
    expect(booksUpdate.update).toHaveBeenCalledWith({
      readers: [ME, BIA],
    });
    expect(booksUpdate.eq).toHaveBeenCalledWith("id", "book-1");
  });

  it("não atualiza o livro quando a pessoa já é leitora", async () => {
    const books = chain({
      data: {
        id: "book-1",
        user_id: ME,
        chosen_by: null,
        readers: [ME, BIA],
      },
      error: null,
    });
    const client: Client = {
      auth: authLogged(ME),
      from: vi.fn(() => books),
    };
    const route = await loadRoute(client);
    const response = await route.POST(post(BIA), {
      params: Promise.resolve({ id: "book-1" }),
    });

    expect(response.status).toBe(200);
    expect(books.update).not.toHaveBeenCalled();
    expect(client.from).not.toHaveBeenCalledWith("user_followers");
  });
});
