import { describe, expect, it, vi } from "vitest";

type ClientMock = {
  auth: { getUser: ReturnType<typeof vi.fn> };
  from: ReturnType<typeof vi.fn>;
  rpc: ReturnType<typeof vi.fn>;
};

function buildShelfBooksSelect(rows: { book_id: string | null }[]) {
  const order = vi.fn().mockResolvedValue({ data: rows, error: null });
  const eq = vi.fn(() => ({ order }));
  const select = vi.fn(() => ({ eq }));
  return { select, eq, order };
}

async function loadRoute() {
  vi.resetModules();
  return import("./route");
}

describe("POST /api/shelves/[id]/books/reorder (RN45 dono via RPC, RN50 ordem por book_id)", () => {
  it("retorna 401 quando não há sessão (RN48)", async () => {
    const client: ClientMock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
      from: vi.fn(),
      rpc: vi.fn(),
    };

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { POST } = await loadRoute();
    const res = await POST(
      new Request("http://localhost/api/shelves/s1/books/reorder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          bookIds: [
            "00000000-0000-4000-8000-000000000001",
            "00000000-0000-4000-8000-000000000002",
          ],
        }),
      }),
      { params: { id: "s1" } },
    );

    expect(res.status).toBe(401);
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it("retorna 400 quando o corpo não é JSON válido", async () => {
    const client: ClientMock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: vi.fn(),
      rpc: vi.fn(),
    };

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { POST } = await loadRoute();
    const res = await POST(
      new Request("http://localhost/api/shelves/s1/books/reorder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{",
      }),
      { params: Promise.resolve({ id: "s1" }) },
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid JSON" });
    expect(client.from).not.toHaveBeenCalled();
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it("retorna 400 quando o corpo falha na validação Zod (UUID)", async () => {
    const client: ClientMock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: vi.fn(),
      rpc: vi.fn(),
    };

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { POST } = await loadRoute();
    const res = await POST(
      new Request("http://localhost/api/shelves/s1/books/reorder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookIds: ["not-a-uuid"] }),
      }),
      { params: Promise.resolve({ id: "s1" }) },
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid body" });
    expect(client.from).not.toHaveBeenCalled();
  });

  it("retorna 500 quando a leitura de custom_shelf_books falha", async () => {
    const shelfBooks = buildShelfBooksSelect([]);
    shelfBooks.order.mockResolvedValue({
      data: null,
      error: { message: "db read failed" },
    });

    const client: ClientMock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: vi.fn(() => shelfBooks),
      rpc: vi.fn(),
    };

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { POST } = await loadRoute();
    const idA = "00000000-0000-4000-8000-000000000001";
    const idB = "00000000-0000-4000-8000-000000000002";
    const res = await POST(
      new Request("http://localhost/api/shelves/s1/books/reorder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookIds: [idA, idB] }),
      }),
      { params: Promise.resolve({ id: "s1" }) },
    );

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "db read failed" });
    expect(client.from).toHaveBeenCalledWith("custom_shelf_books");
    expect(shelfBooks.select).toHaveBeenCalledWith("book_id");
    expect(shelfBooks.eq).toHaveBeenCalledWith("shelf_id", "s1");
    expect(shelfBooks.order).toHaveBeenCalledWith("sort_order", { ascending: true });
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it("aceita data null na listagem como estante vazia e chama o RPC com bookIds vazio", async () => {
    const shelfBooks = buildShelfBooksSelect([]);
    shelfBooks.order.mockResolvedValue({ data: null, error: null });

    const client: ClientMock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: vi.fn(() => shelfBooks),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { POST } = await loadRoute();
    const res = await POST(
      new Request("http://localhost/api/shelves/s1/books/reorder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookIds: [] }),
      }),
      { params: Promise.resolve({ id: "s1" }) },
    );

    expect(res.status).toBe(200);
    expect(client.rpc).toHaveBeenCalledWith("reorder_custom_shelf_books", {
      p_shelf_id: "s1",
      p_book_ids: [],
    });
  });

  it("ignora linhas com book_id nulo ao montar a ordem atual (RN50)", async () => {
    const idA = "00000000-0000-4000-8000-000000000001";
    const idB = "00000000-0000-4000-8000-000000000002";
    const shelfBooks = buildShelfBooksSelect([
      { book_id: idA },
      { book_id: null },
      { book_id: idB },
    ]);

    const client: ClientMock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: vi.fn(() => shelfBooks),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { POST } = await loadRoute();
    const res = await POST(
      new Request("http://localhost/api/shelves/s1/books/reorder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookIds: [idB, idA] }),
      }),
      { params: { id: "s1" } },
    );

    expect(res.status).toBe(200);
    expect(client.rpc).toHaveBeenCalledWith("reorder_custom_shelf_books", {
      p_shelf_id: "s1",
      p_book_ids: [idB, idA],
    });
  });

  it("retorna 400 quando a ordem não coincide com os livros da estante (RN50)", async () => {
    const idA = "00000000-0000-4000-8000-000000000001";
    const idB = "00000000-0000-4000-8000-000000000002";
    const shelfBooks = buildShelfBooksSelect([{ book_id: idA }, { book_id: idB }]);

    const client: ClientMock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: vi.fn(() => shelfBooks),
      rpc: vi.fn(),
    };

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { POST } = await loadRoute();
    const res = await POST(
      new Request("http://localhost/api/shelves/s1/books/reorder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookIds: [idA] }),
      }),
      { params: Promise.resolve({ id: "s1" }) },
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "A nova ordem deve conter exatamente os mesmos livros da estante.",
    });
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it("retorna 403 quando o RPC indica proibição (mensagem Forbidden)", async () => {
    const idA = "00000000-0000-4000-8000-000000000001";
    const idB = "00000000-0000-4000-8000-000000000002";
    const shelfBooks = buildShelfBooksSelect([
      { book_id: idA },
      { book_id: idB },
    ]);

    const client: ClientMock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: vi.fn(() => shelfBooks),
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Forbidden: not owner" },
      }),
    };

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { POST } = await loadRoute();
    const res = await POST(
      new Request("http://localhost/api/shelves/s1/books/reorder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookIds: [idB, idA] }),
      }),
      { params: Promise.resolve({ id: "s1" }) },
    );

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "Forbidden: not owner" });
  });

  it("retorna 403 quando o RPC indica recurso não encontrado", async () => {
    const idA = "00000000-0000-4000-8000-000000000001";
    const idB = "00000000-0000-4000-8000-000000000002";
    const shelfBooks = buildShelfBooksSelect([
      { book_id: idA },
      { book_id: idB },
    ]);

    const client: ClientMock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: vi.fn(() => shelfBooks),
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Shelf not found" },
      }),
    };

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { POST } = await loadRoute();
    const res = await POST(
      new Request("http://localhost/api/shelves/s1/books/reorder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookIds: [idB, idA] }),
      }),
      { params: Promise.resolve({ id: "s1" }) },
    );

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "Shelf not found" });
  });

  it("retorna 500 quando o RPC falha sem indicar Forbidden ou not found", async () => {
    const idA = "00000000-0000-4000-8000-000000000001";
    const idB = "00000000-0000-4000-8000-000000000002";
    const shelfBooks = buildShelfBooksSelect([
      { book_id: idA },
      { book_id: idB },
    ]);

    const client: ClientMock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: vi.fn(() => shelfBooks),
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "constraint violation" },
      }),
    };

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { POST } = await loadRoute();
    const res = await POST(
      new Request("http://localhost/api/shelves/s1/books/reorder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookIds: [idB, idA] }),
      }),
      { params: Promise.resolve({ id: "s1" }) },
    );

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "constraint violation" });
  });

  it("retorna 500 com mensagem padrão quando o erro do RPC não tem message", async () => {
    const idA = "00000000-0000-4000-8000-000000000001";
    const idB = "00000000-0000-4000-8000-000000000002";
    const shelfBooks = buildShelfBooksSelect([
      { book_id: idA },
      { book_id: idB },
    ]);

    const client: ClientMock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: vi.fn(() => shelfBooks),
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: {},
      }),
    };

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { POST } = await loadRoute();
    const res = await POST(
      new Request("http://localhost/api/shelves/s1/books/reorder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookIds: [idB, idA] }),
      }),
      { params: Promise.resolve({ id: "s1" }) },
    );

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Failed to reorder" });
  });

  it("chama reorder_custom_shelf_books quando o payload é válido em relação aos book_id da estante (RN50)", async () => {
    const idA = "00000000-0000-4000-8000-000000000001";
    const idB = "00000000-0000-4000-8000-000000000002";
    const shelfBooks = buildShelfBooksSelect([
      { book_id: idA },
      { book_id: idB },
    ]);

    const client: ClientMock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: vi.fn(() => shelfBooks),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { POST } = await loadRoute();
    const res = await POST(
      new Request("http://localhost/api/shelves/s1/books/reorder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookIds: [idB, idA] }),
      }),
      { params: Promise.resolve({ id: "s1" }) },
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(client.from).toHaveBeenCalledWith("custom_shelf_books");
    expect(shelfBooks.select).toHaveBeenCalledWith("book_id");
    expect(shelfBooks.eq).toHaveBeenCalledWith("shelf_id", "s1");
    expect(shelfBooks.order).toHaveBeenCalledWith("sort_order", { ascending: true });
    expect(client.rpc).toHaveBeenCalledWith("reorder_custom_shelf_books", {
      p_shelf_id: "s1",
      p_book_ids: [idB, idA],
    });
  });

  it("retorna 400 com mensagem genérica quando validação lança valor que não é Error", async () => {
    const idA = "00000000-0000-4000-8000-000000000001";
    const idB = "00000000-0000-4000-8000-000000000002";
    const shelfBooks = buildShelfBooksSelect([
      { book_id: idA },
      { book_id: idB },
    ]);

    const client: ClientMock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: vi.fn(() => shelfBooks),
      rpc: vi.fn(),
    };

    vi.doMock("@/modules/bookshelves/utils/shelfBookOrder", () => ({
      validateShelfReorderPayload: vi.fn(() => {
        throw "throwable-string";
      }),
    }));

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { POST } = await loadRoute();
    const res = await POST(
      new Request("http://localhost/api/shelves/s1/books/reorder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookIds: [idB, idA] }),
      }),
      { params: Promise.resolve({ id: "s1" }) },
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid order" });
    expect(client.rpc).not.toHaveBeenCalled();
  });
});
