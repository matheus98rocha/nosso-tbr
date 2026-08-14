import { describe, expect, it, vi } from "vitest";

import {
  SHELF_BOOK_CANNOT_ADD_MESSAGE,
  SHELF_BOOK_DUPLICATE_CODE,
  SHELF_BOOK_FORBIDDEN_NOT_PARTICIPANT_MESSAGE,
  SHELF_FORBIDDEN_NOT_OWNER_MESSAGE,
  SHELF_NOT_FOUND_MESSAGE,
  SHELF_BOOK_NOT_FOUND_MESSAGE,
} from "@/constants/shelfBook";

type ClientMock = {
  auth: { getUser: ReturnType<typeof vi.fn> };
  from: ReturnType<typeof vi.fn>;
};

function chainMaybeSingle(data: unknown, error: unknown, eqDepth: 1 | 2) {
  const maybeSingle = vi.fn().mockResolvedValue({ data, error });
  if (eqDepth === 1) {
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    return { select, eq, maybeSingle };
  }
  const innerEq = vi.fn(() => ({ maybeSingle }));
  const outerEq = vi.fn(() => ({ eq: innerEq }));
  const select = vi.fn(() => ({ eq: outerEq }));
  return { select, outerEq, innerEq, maybeSingle };
}

function chainDelete(error: unknown) {
  const innerEq = vi.fn().mockResolvedValue({ error });
  const outerEq = vi.fn(() => ({ eq: innerEq }));
  const del = vi.fn(() => ({ eq: outerEq }));
  return { delete: del, outerEq, innerEq };
}

function authenticatedClient(
  userId: string,
  fromImpl: (table: string) => unknown,
): ClientMock {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      }),
    },
    from: vi.fn(fromImpl),
  };
}

async function loadRoute() {
  vi.resetModules();
  return import("./route");
}

describe("POST /api/shelves/[id]/books/[bookId] (RN45 dono, RN42 participação, duplicidade)", () => {
  it("retorna 401 quando não há sessão (RN48)", async () => {
    const client: ClientMock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
      from: vi.fn(),
    };

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { POST } = await loadRoute();
    const res = await POST(
      new Request("http://localhost/api/shelves/shelf-1/books/book-1", {
        method: "POST",
      }),
      {
        params: Promise.resolve({ id: "shelf-1", bookId: "book-1" }),
      },
    );

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(client.from).not.toHaveBeenCalled();
  });

  it("retorna 404 com mensagem unificada quando a estante não existe (RN45)", async () => {
    const userId = "user-1";
    const shelfBuilder = chainMaybeSingle(null, null, 1);
    shelfBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });

    const client = authenticatedClient(userId, (table: string) => {
      if (table === "custom_shelves") return shelfBuilder;
      return {};
    });

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { POST } = await loadRoute();
    const res = await POST(
      new Request("http://localhost/api/shelves/missing/books/b1", { method: "POST" }),
      { params: Promise.resolve({ id: "missing", bookId: "b1" }) },
    );

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: SHELF_BOOK_CANNOT_ADD_MESSAGE });
    expect(client.from).toHaveBeenCalledWith("custom_shelves");
    expect(shelfBuilder.select).toHaveBeenCalledWith("id, user_id");
    expect(shelfBuilder.eq).toHaveBeenCalledWith("id", "missing");
  });

  it("retorna 403 quando o usuário não é dono da estante (RN45)", async () => {
    const userId = "user-1";
    const shelfBuilder = chainMaybeSingle(
      { id: "shelf-1", user_id: "other-owner" },
      null,
      1,
    );

    const client = authenticatedClient(userId, (table: string) => {
      if (table === "custom_shelves") return shelfBuilder;
      return {};
    });

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { POST } = await loadRoute();
    const res = await POST(
      new Request("http://localhost/api/shelves/shelf-1/books/b1", { method: "POST" }),
      { params: Promise.resolve({ id: "shelf-1", bookId: "b1" }) },
    );

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: SHELF_BOOK_CANNOT_ADD_MESSAGE });
  });

  it("retorna 500 quando a consulta da estante falha", async () => {
    const userId = "user-1";
    const shelfBuilder = chainMaybeSingle(null, { message: "shelf db error" }, 1);

    const client = authenticatedClient(userId, (table: string) => {
      if (table === "custom_shelves") return shelfBuilder;
      return {};
    });

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { POST } = await loadRoute();
    const res = await POST(
      new Request("http://localhost/api/shelves/shelf-1/books/b1", { method: "POST" }),
      { params: Promise.resolve({ id: "shelf-1", bookId: "b1" }) },
    );

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "shelf db error" });
  });

  it("retorna 409 quando o livro já está na estante", async () => {
    const userId = "user-1";
    const shelfBuilder = chainMaybeSingle(
      {
        id: "shelf-1",
        user_id: userId,
      },
      null,
      1,
    );
    const existingBuilder = chainMaybeSingle({ id: "row-1" }, null, 2);

    const client = authenticatedClient(userId, (table: string) => {
      if (table === "custom_shelves") return shelfBuilder;
      if (table === "custom_shelf_books") return existingBuilder;
      return {};
    });

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { POST } = await loadRoute();
    const res = await POST(
      new Request("http://localhost/api/shelves/shelf-1/books/book-1", {
        method: "POST",
      }),
      {
        params: Promise.resolve({ id: "shelf-1", bookId: "book-1" }),
      },
    );

    expect(res.status).toBe(409);
    const body = (await res.json()) as {
      error: string;
      code: string;
    };
    expect(body.error).toBe(SHELF_BOOK_CANNOT_ADD_MESSAGE);
    expect(body.code).toBe(SHELF_BOOK_DUPLICATE_CODE);
    expect(existingBuilder.outerEq).toHaveBeenCalledWith("shelf_id", "shelf-1");
    expect(existingBuilder.innerEq).toHaveBeenCalledWith("book_id", "book-1");
  });

  it("retorna 403 quando o usuário não participa do livro (RN42)", async () => {
    const userId = "user-1";
    const shelfBuilder = chainMaybeSingle(
      { id: "shelf-1", user_id: userId },
      null,
      1,
    );
    const existingBuilder = chainMaybeSingle(null, null, 2);
    const bookBuilder = chainMaybeSingle(
      {
        user_id: "other",
        chosen_by: "other",
        readers: ["other"],
      },
      null,
      1,
    );

    let shelfBooksPass = 0;
    const client = authenticatedClient(userId, (table: string) => {
      if (table === "custom_shelves") return shelfBuilder;
      if (table === "books") return bookBuilder;
      if (table === "custom_shelf_books") {
        shelfBooksPass += 1;
        if (shelfBooksPass === 1) return existingBuilder;
        return { insert: vi.fn() };
      }
      return {};
    });

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { POST } = await loadRoute();
    const res = await POST(
      new Request("http://localhost/api/shelves/shelf-1/books/book-1", { method: "POST" }),
      { params: Promise.resolve({ id: "shelf-1", bookId: "book-1" }) },
    );

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: SHELF_BOOK_CANNOT_ADD_MESSAGE });
    expect(bookBuilder.select).toHaveBeenCalledWith("user_id,chosen_by,readers");
    expect(bookBuilder.eq).toHaveBeenCalledWith("id", "book-1");
  });

  it("retorna 201 e insere vínculo quando dono participa do livro (RN42, RN45, RN54)", async () => {
    const userId = "user-1";
    const shelfBuilder = chainMaybeSingle(
      { id: "shelf-1", user_id: userId },
      null,
      1,
    );
    const existingBuilder = chainMaybeSingle(null, null, 2);
    const bookBuilder = chainMaybeSingle(
      {
        user_id: userId,
        chosen_by: userId,
        readers: [userId],
      },
      null,
      1,
    );
    const insert = vi.fn().mockResolvedValue({ error: null });

    let shelfBooksPass = 0;
    const client = authenticatedClient(userId, (table: string) => {
      if (table === "custom_shelves") return shelfBuilder;
      if (table === "books") return bookBuilder;
      if (table === "custom_shelf_books") {
        shelfBooksPass += 1;
        if (shelfBooksPass === 1) return existingBuilder;
        return { insert };
      }
      return {};
    });

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { POST } = await loadRoute();
    const res = await POST(
      new Request("http://localhost/api/shelves/shelf-1/books/book-1", { method: "POST" }),
      { params: Promise.resolve({ id: "shelf-1", bookId: "book-1" }) },
    );

    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(insert).toHaveBeenCalledWith({
      shelf_id: "shelf-1",
      book_id: "book-1",
    });
  });

  it("retorna 500 quando a consulta de vínculo existente falha", async () => {
    const userId = "user-1";
    const shelfBuilder = chainMaybeSingle(
      { id: "shelf-1", user_id: userId },
      null,
      1,
    );
    const existingBuilder = chainMaybeSingle(null, { message: "query failed" }, 2);

    const client = authenticatedClient(userId, (table: string) => {
      if (table === "custom_shelves") return shelfBuilder;
      if (table === "custom_shelf_books") return existingBuilder;
      return {};
    });

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { POST } = await loadRoute();
    const res = await POST(
      new Request("http://localhost/api/shelves/shelf-1/books/book-1", { method: "POST" }),
      { params: Promise.resolve({ id: "shelf-1", bookId: "book-1" }) },
    );

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "query failed" });
  });

  it("retorna 500 quando a consulta do livro falha", async () => {
    const userId = "user-1";
    const shelfBuilder = chainMaybeSingle({ id: "shelf-1", user_id: userId }, null, 1);
    const existingBuilder = chainMaybeSingle(null, null, 2);
    const bookBuilder = chainMaybeSingle(null, { message: "book read error" }, 1);

    let shelfBooksPass = 0;
    const client = authenticatedClient(userId, (table: string) => {
      if (table === "custom_shelves") return shelfBuilder;
      if (table === "books") return bookBuilder;
      if (table === "custom_shelf_books") {
        shelfBooksPass += 1;
        if (shelfBooksPass === 1) return existingBuilder;
        return { insert: vi.fn() };
      }
      return {};
    });

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { POST } = await loadRoute();
    const res = await POST(
      new Request("http://localhost/api/shelves/shelf-1/books/book-1", { method: "POST" }),
      { params: Promise.resolve({ id: "shelf-1", bookId: "book-1" }) },
    );

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "book read error" });
  });

  it("retorna 404 quando o livro não existe", async () => {
    const userId = "user-1";
    const shelfBuilder = chainMaybeSingle({ id: "shelf-1", user_id: userId }, null, 1);
    const existingBuilder = chainMaybeSingle(null, null, 2);
    const bookBuilder = chainMaybeSingle(null, null, 1);
    bookBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });

    const client = authenticatedClient(userId, (table: string) => {
      if (table === "custom_shelves") return shelfBuilder;
      if (table === "books") return bookBuilder;
      if (table === "custom_shelf_books") return existingBuilder;
      return {};
    });

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { POST } = await loadRoute();
    const res = await POST(
      new Request("http://localhost/api/shelves/shelf-1/books/missing", { method: "POST" }),
      { params: Promise.resolve({ id: "shelf-1", bookId: "missing" }) },
    );

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: SHELF_BOOK_CANNOT_ADD_MESSAGE });
  });

  it("retorna 500 quando insert falha com erro que não é 23505", async () => {
    const userId = "user-1";
    const shelfBuilder = chainMaybeSingle({ id: "shelf-1", user_id: userId }, null, 1);
    const existingBuilder = chainMaybeSingle(null, null, 2);
    const bookBuilder = chainMaybeSingle(
      { user_id: userId, chosen_by: userId, readers: [userId] },
      null,
      1,
    );
    const insert = vi.fn().mockResolvedValue({
      error: { code: "57014", message: "statement timeout" },
    });

    let shelfBooksPass = 0;
    const client = authenticatedClient(userId, (table: string) => {
      if (table === "custom_shelves") return shelfBuilder;
      if (table === "books") return bookBuilder;
      if (table === "custom_shelf_books") {
        shelfBooksPass += 1;
        if (shelfBooksPass === 1) return existingBuilder;
        return { insert };
      }
      return {};
    });

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { POST } = await loadRoute();
    const res = await POST(
      new Request("http://localhost/api/shelves/shelf-1/books/book-1", { method: "POST" }),
      { params: Promise.resolve({ id: "shelf-1", bookId: "book-1" }) },
    );

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "statement timeout" });
  });

  it("retorna 409 com código duplicado quando insert recebe violação única 23505", async () => {
    const userId = "user-1";
    const shelfBuilder = chainMaybeSingle(
      { id: "shelf-1", user_id: userId },
      null,
      1,
    );
    const existingBuilder = chainMaybeSingle(null, null, 2);
    const bookBuilder = chainMaybeSingle(
      { user_id: userId, chosen_by: userId, readers: [userId] },
      null,
      1,
    );
    const insert = vi.fn().mockResolvedValue({
      error: { code: "23505", message: "unique violation" },
    });

    let shelfBooksPass = 0;
    const client = authenticatedClient(userId, (table: string) => {
      if (table === "custom_shelves") return shelfBuilder;
      if (table === "books") return bookBuilder;
      if (table === "custom_shelf_books") {
        shelfBooksPass += 1;
        if (shelfBooksPass === 1) return existingBuilder;
        return { insert };
      }
      return {};
    });

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { POST } = await loadRoute();
    const res = await POST(
      new Request("http://localhost/api/shelves/shelf-1/books/book-1", { method: "POST" }),
      { params: Promise.resolve({ id: "shelf-1", bookId: "book-1" }) },
    );

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toEqual({
      error: SHELF_BOOK_CANNOT_ADD_MESSAGE,
      code: SHELF_BOOK_DUPLICATE_CODE,
    });
  });
});

describe("DELETE /api/shelves/[id]/books/[bookId] (RN45 dono, RN42 participação, só vínculo)", () => {
  it("retorna 401 quando não há sessão (RN48)", async () => {
    const client: ClientMock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
      from: vi.fn(),
    };

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { DELETE } = await loadRoute();
    const res = await DELETE(
      new Request("http://localhost/api/shelves/s1/books/b1", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "s1", bookId: "b1" }) },
    );

    expect(res.status).toBe(401);
    expect(client.from).not.toHaveBeenCalled();
  });

  it("retorna 404 quando a estante não existe", async () => {
    const userId = "user-1";
    const shelfBuilder = chainMaybeSingle(null, null, 1);
    shelfBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });

    const client = authenticatedClient(userId, (table: string) => {
      if (table === "custom_shelves") return shelfBuilder;
      return {};
    });

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { DELETE } = await loadRoute();
    const res = await DELETE(
      new Request("http://localhost/api/shelves/missing/books/b1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "missing", bookId: "b1" }) },
    );

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: SHELF_NOT_FOUND_MESSAGE });
  });

  it("retorna 403 quando o usuário não é dono da estante (RN45)", async () => {
    const userId = "user-1";
    const shelfBuilder = chainMaybeSingle(
      { id: "shelf-1", user_id: "other" },
      null,
      1,
    );

    const client = authenticatedClient(userId, (table: string) => {
      if (table === "custom_shelves") return shelfBuilder;
      return {};
    });

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { DELETE } = await loadRoute();
    const res = await DELETE(
      new Request("http://localhost/api/shelves/shelf-1/books/b1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "shelf-1", bookId: "b1" }) },
    );

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: SHELF_FORBIDDEN_NOT_OWNER_MESSAGE });
  });

  it("retorna 404 quando o livro não existe", async () => {
    const userId = "user-1";
    const shelfBuilder = chainMaybeSingle(
      { id: "shelf-1", user_id: userId },
      null,
      1,
    );
    const bookBuilder = chainMaybeSingle(null, null, 1);
    bookBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });

    const client = authenticatedClient(userId, (table: string) => {
      if (table === "custom_shelves") return shelfBuilder;
      if (table === "books") return bookBuilder;
      return {};
    });

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { DELETE } = await loadRoute();
    const res = await DELETE(
      new Request("http://localhost/api/shelves/shelf-1/books/b1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "shelf-1", bookId: "b1" }) },
    );

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: SHELF_BOOK_NOT_FOUND_MESSAGE });
    expect(client.from).toHaveBeenCalledWith("books");
  });

  it("retorna 403 quando o usuário não participa do livro (RN42)", async () => {
    const userId = "user-1";
    const shelfBuilder = chainMaybeSingle(
      { id: "shelf-1", user_id: userId },
      null,
      1,
    );
    const bookBuilder = chainMaybeSingle(
      {
        user_id: "x",
        chosen_by: "y",
        readers: ["z"],
      },
      null,
      1,
    );

    const client = authenticatedClient(userId, (table: string) => {
      if (table === "custom_shelves") return shelfBuilder;
      if (table === "books") return bookBuilder;
      return {};
    });

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { DELETE } = await loadRoute();
    const res = await DELETE(
      new Request("http://localhost/api/shelves/shelf-1/books/book-1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "shelf-1", bookId: "book-1" }) },
    );

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({
      error: SHELF_BOOK_FORBIDDEN_NOT_PARTICIPANT_MESSAGE,
    });
  });

  it("retorna 500 quando a consulta da estante falha", async () => {
    const userId = "user-1";
    const shelfBuilder = chainMaybeSingle(null, { message: "shelf outage" }, 1);

    const client = authenticatedClient(userId, (table: string) => {
      if (table === "custom_shelves") return shelfBuilder;
      return {};
    });

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { DELETE } = await loadRoute();
    const res = await DELETE(
      new Request("http://localhost/api/shelves/shelf-1/books/b1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "shelf-1", bookId: "b1" }) },
    );

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "shelf outage" });
  });

  it("retorna 500 quando a consulta do livro falha", async () => {
    const userId = "user-1";
    const shelfBuilder = chainMaybeSingle(
      { id: "shelf-1", user_id: userId },
      null,
      1,
    );
    const bookBuilder = chainMaybeSingle(null, { message: "read fail" }, 1);

    const client = authenticatedClient(userId, (table: string) => {
      if (table === "custom_shelves") return shelfBuilder;
      if (table === "books") return bookBuilder;
      return {};
    });

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { DELETE } = await loadRoute();
    const res = await DELETE(
      new Request("http://localhost/api/shelves/shelf-1/books/b1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "shelf-1", bookId: "b1" }) },
    );

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "read fail" });
  });

  it("retorna 500 quando delete do vínculo falha", async () => {
    const userId = "user-1";
    const shelfBuilder = chainMaybeSingle(
      { id: "shelf-1", user_id: userId },
      null,
      1,
    );
    const bookBuilder = chainMaybeSingle(
      { user_id: userId, chosen_by: userId, readers: [userId] },
      null,
      1,
    );
    const delChain = chainDelete({ message: "delete blocked" });

    const client = authenticatedClient(userId, (table: string) => {
      if (table === "custom_shelves") return shelfBuilder;
      if (table === "books") return bookBuilder;
      if (table === "custom_shelf_books") return delChain;
      return {};
    });

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { DELETE } = await loadRoute();
    const res = await DELETE(
      new Request("http://localhost/api/shelves/shelf-1/books/book-1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "shelf-1", bookId: "book-1" }) },
    );

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "delete blocked" });
  });

  it("remove apenas o vínculo e retorna ok quando dono e participante (RN42, RN45)", async () => {
    const userId = "user-1";
    const shelfBuilder = chainMaybeSingle(
      { id: "shelf-1", user_id: userId },
      null,
      1,
    );
    const bookBuilder = chainMaybeSingle(
      { user_id: userId, chosen_by: userId, readers: [userId] },
      null,
      1,
    );
    const delChain = chainDelete(null);

    const client = authenticatedClient(userId, (table: string) => {
      if (table === "custom_shelves") return shelfBuilder;
      if (table === "books") return bookBuilder;
      if (table === "custom_shelf_books") return delChain;
      return {};
    });

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { DELETE } = await loadRoute();
    const res = await DELETE(
      new Request("http://localhost/api/shelves/shelf-1/books/book-1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "shelf-1", bookId: "book-1" }) },
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(delChain.outerEq).toHaveBeenCalledWith("shelf_id", "shelf-1");
    expect(delChain.innerEq).toHaveBeenCalledWith("book_id", "book-1");
  });
});
