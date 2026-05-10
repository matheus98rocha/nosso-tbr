import { describe, expect, it, vi } from "vitest";

const COMMENT_ID = "550e8400-e29b-41d4-a716-446655440099";
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

describe("DELETE /api/collective-reading-comments/[id]", () => {
  it("retorna 403 quando o comentário é de outro usuário", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: COMMENT_ID, user_id: "other-user" },
      error: null,
    });
    const select = vi.fn(() => ({
      eq: vi.fn(() => ({ maybeSingle })),
    }));
    const from = vi.fn(() => ({ select }));
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
    const res = await route.DELETE(
      new Request("http://localhost"),
      { params: Promise.resolve({ id: COMMENT_ID }) },
    );
    expect(res.status).toBe(403);
  });

  it("remove quando user_id confere", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: COMMENT_ID, user_id: USER_ID },
      error: null,
    });
    const select = vi.fn(() => ({
      eq: vi.fn(() => ({ maybeSingle })),
    }));
    const deleteEq = vi.fn().mockResolvedValue({ error: null });
    const deleteFn = vi.fn(() => ({ eq: deleteEq }));
    let tableCall = 0;
    const from = vi.fn(() => {
      tableCall += 1;
      if (tableCall === 1) return { select };
      return { delete: deleteFn };
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
    const res = await route.DELETE(
      new Request("http://localhost"),
      { params: Promise.resolve({ id: COMMENT_ID }) },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
    expect(deleteEq).toHaveBeenCalledWith("id", COMMENT_ID);
  });
});
