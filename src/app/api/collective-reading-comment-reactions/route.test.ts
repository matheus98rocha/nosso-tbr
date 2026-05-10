import { describe, expect, it, vi } from "vitest";

const COMMENT_ID = "550e8400-e29b-41d4-a716-446655440099";
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

describe("POST /api/collective-reading-comment-reactions", () => {
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
        body: JSON.stringify({ commentId: COMMENT_ID, reaction: "like" }),
      }),
    );
    expect(res.status).toBe(401);
    expect(client.from).not.toHaveBeenCalled();
  });

  it("retorna 404 quando comentário não existe", async () => {
    const maybeSingleComment = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    const selectComment = vi.fn(() => ({
      eq: vi.fn(() => ({ maybeSingle: maybeSingleComment })),
    }));
    const from = vi.fn(() => ({ select: selectComment }));
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
        body: JSON.stringify({ commentId: COMMENT_ID, reaction: "like" }),
      }),
    );
    expect(res.status).toBe(404);
  });

  it("faz upsert quando usuário participa da leitura coletiva", async () => {
    const maybeSingleComment = vi.fn().mockResolvedValue({
      data: { id: COMMENT_ID, book_id: BOOK_ID },
      error: null,
    });
    const selectComment = vi.fn(() => ({
      eq: vi.fn(() => ({ maybeSingle: maybeSingleComment })),
    }));

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

    const upsert = vi.fn().mockResolvedValue({ error: null });

    const reactionsSelectEq = vi.fn().mockResolvedValue({
      data: [{ user_id: USER_ID, reaction: "like" }],
      error: null,
    });
    const reactionsSelect = vi.fn(() => ({
      eq: reactionsSelectEq,
    }));

    const from = vi.fn((table: string) => {
      if (table === "collective_reading_comments") return { select: selectComment };
      if (table === "books") return { select: selectBook };
      if (table === "collective_reading_comment_reactions") {
        return {
          upsert,
          select: reactionsSelect,
        };
      }
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
        body: JSON.stringify({ commentId: COMMENT_ID, reaction: "like" }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      commentId: COMMENT_ID,
      likeCount: 1,
      dislikeCount: 0,
      userReaction: "like",
    });
    expect(upsert).toHaveBeenCalledWith(
      {
        comment_id: COMMENT_ID,
        book_id: BOOK_ID,
        user_id: USER_ID,
        reaction: "like",
      },
      { onConflict: "comment_id,user_id" },
    );
  });
});
