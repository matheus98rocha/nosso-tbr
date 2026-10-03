import { describe, expect, it, vi } from "vitest";

type Query = Record<string, ReturnType<typeof vi.fn>>;

type Client = {
  auth: { getUser: ReturnType<typeof vi.fn> };
  from: ReturnType<typeof vi.fn>;
};

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

  for (const method of ["select", "eq", "in", "or", "order", "limit"]) {
    query[method] = vi.fn(self);
  }

  query.single = vi.fn().mockResolvedValue(resolved);
  query.then = vi.fn((resolve: (value: unknown) => unknown) =>
    Promise.resolve(resolved).then(resolve),
  );

  return query;
}

async function loadRoute(client: Client) {
  vi.resetModules();
  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue(client),
  }));

  return import("./route");
}

const BIA_ID = "22222222-2222-4222-8222-222222222222";

describe("GET /api/books/[id]/reader-candidates", () => {
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
    const response = await route.GET(
      new Request("http://localhost/api/books/book-1/reader-candidates?q=bia"),
      { params: Promise.resolve({ id: "book-1" }) },
    );

    expect(response.status).toBe(401);
    expect(client.from).not.toHaveBeenCalled();
  });

  it("não consulta o banco quando a busca tem menos de duas letras", async () => {
    const client: Client = {
      auth: authLogged("11111111-1111-4111-8111-111111111111"),
      from: vi.fn(),
    };
    const route = await loadRoute(client);
    const response = await route.GET(
      new Request("http://localhost/api/books/book-1/reader-candidates?q=b"),
      { params: Promise.resolve({ id: "book-1" }) },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ candidates: [] });
    expect(client.from).not.toHaveBeenCalled();
  });

  it("busca só quem é seguido e ainda não está no livro, por nome ou e-mail", async () => {
    const books = chain({
      data: {
        id: "book-1",
        user_id: "11111111-1111-4111-8111-111111111111",
        chosen_by: null,
        readers: ["11111111-1111-4111-8111-111111111111", "33333333-3333-4333-8333-333333333333"],
      },
      error: null,
    });
    const follows = chain({
      data: [
        { following_id: "33333333-3333-4333-8333-333333333333" },
        { following_id: BIA_ID },
      ],
      error: null,
    });
    const users = chain({
      data: [
        {
          id: BIA_ID,
          display_name: "Bianca",
          email: "bia@mail.com",
        },
        {
          id: "44444444-4444-4444-8444-444444444444",
          display_name: "Fora",
          email: "fora@mail.com",
        },
      ],
      error: null,
    });
    const client: Client = {
      auth: authLogged("11111111-1111-4111-8111-111111111111"),
      from: vi.fn((table: string) => {
        if (table === "books") return books;
        if (table === "user_followers") return follows;
        if (table === "users") return users;
        throw new Error(table);
      }),
    };
    const route = await loadRoute(client);
    const response = await route.GET(
      new Request("http://localhost/api/books/book-1/reader-candidates?q=bia"),
      { params: Promise.resolve({ id: "book-1" }) },
    );

    expect(response.status).toBe(200);
    expect(follows.eq).toHaveBeenCalledWith(
      "follower_id",
      "11111111-1111-4111-8111-111111111111",
    );
    expect(users.in).toHaveBeenCalledWith("id", [BIA_ID]);
    expect(users.or).toHaveBeenCalledWith(
      'display_name.ilike."%bia%",email.ilike."%bia%"',
    );
    expect(await response.json()).toEqual({
      candidates: [
        { id: BIA_ID, displayName: "Bianca", email: "bia@mail.com" },
      ],
    });
  });

  it("recusa quem não participa da leitura", async () => {
    const books = chain({
      data: {
        id: "book-1",
        user_id: "owner",
        chosen_by: null,
        readers: ["owner"],
      },
      error: null,
    });
    const client: Client = {
      auth: authLogged("11111111-1111-4111-8111-111111111111"),
      from: vi.fn(() => books),
    };
    const route = await loadRoute(client);
    const response = await route.GET(
      new Request("http://localhost/api/books/book-1/reader-candidates?q=bia"),
      { params: Promise.resolve({ id: "book-1" }) },
    );

    expect(response.status).toBe(403);
  });
});
