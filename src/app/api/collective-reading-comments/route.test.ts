import { describe, expect, it, vi } from "vitest";

const BOOK_ID = "550e8400-e29b-41d4-a716-446655440001";
const USER_ID = "660e8400-e29b-41d4-a716-446655440002";

type Client = {
  auth: { getUser: ReturnType<typeof vi.fn> };
  from: ReturnType<typeof vi.fn>;
};

async function loadRoute(client: Client) {
  vi.resetModules();
  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue(client),
  }));
  return import("./route");
}

describe("POST /api/collective-reading-comments", () => {
  it("retorna 401 sem sessão", async () => {
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
    const res = await route.POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: BOOK_ID,
          content: "Comentário",
        }),
      }),
    );
    expect(res.status).toBe(401);
    expect(client.from).not.toHaveBeenCalled();
  });

  it("retorna 403 quando o livro não é leitura coletiva (apenas um leitor)", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        user_id: null,
        chosen_by: USER_ID,
        readers: [USER_ID],
      },
      error: null,
    });
    const select = vi.fn(() => ({
      eq: vi.fn(() => ({ maybeSingle })),
    }));
    const client: Client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: USER_ID } },
          error: null,
        }),
      },
      from: vi.fn(() => ({ select })),
    };
    const route = await loadRoute(client);
    const res = await route.POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: BOOK_ID,
          content: "Comentário",
        }),
      }),
    );
    expect(res.status).toBe(403);
  });

  it("retorna 403 quando usuário não participa do livro coletivo", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        user_id: null,
        chosen_by: "other-a",
        readers: ["other-a", "other-b"],
      },
      error: null,
    });
    const select = vi.fn(() => ({
      eq: vi.fn(() => ({ maybeSingle })),
    }));
    const client: Client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: USER_ID } },
          error: null,
        }),
      },
      from: vi.fn(() => ({ select })),
    };
    const route = await loadRoute(client);
    const res = await route.POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: BOOK_ID,
          content: "Comentário",
        }),
      }),
    );
    expect(res.status).toBe(403);
  });

  it("insere comentário quando há dois leitores e usuário participa", async () => {
    const inserted = {
      id: "c1",
      book_id: BOOK_ID,
      user_id: USER_ID,
      content: "Comentário",
      created_at: "2026-05-09T12:00:00Z",
    };
    const maybeSingleBook = vi.fn().mockResolvedValue({
      data: {
        user_id: null,
        chosen_by: USER_ID,
        readers: [USER_ID, "other-b"],
      },
      error: null,
    });
    const selectBook = vi.fn(() => ({
      eq: vi.fn(() => ({ maybeSingle: maybeSingleBook })),
    }));
    const singleInsert = vi.fn().mockResolvedValue({
      data: inserted,
      error: null,
    });
    const insert = vi.fn(() => ({
      select: vi.fn(() => ({ single: singleInsert })),
    }));
    let fromCall = 0;
    const from = vi.fn((table: string) => {
      fromCall += 1;
      if (table === "books") return { select: selectBook };
      if (table === "collective_reading_comments") return { insert };
      throw new Error(`unexpected table ${table}`);
    });
    const client: Client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: USER_ID } },
          error: null,
        }),
      },
      from,
    };
    const route = await loadRoute(client);
    const res = await route.POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: BOOK_ID,
          content: "Comentário",
        }),
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual(inserted);
    expect(insert).toHaveBeenCalledWith({
      book_id: BOOK_ID,
      user_id: USER_ID,
      content: "Comentário",
    });
  });
});
