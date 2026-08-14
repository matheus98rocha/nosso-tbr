import { describe, expect, it, vi } from "vitest";

const ROW_ID = "880e8400-e29b-41d4-a716-446655440004";
const OWNER_ID = "660e8400-e29b-41d4-a716-446655440002";

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

describe("PATCH /api/schedule/[id]", () => {
  describe("RN44 — owner isolado", () => {
    it("retorna 403 quando owner da linha difere da sessão", async () => {
      const maybeSingle = vi.fn().mockResolvedValue({
        data: { id: ROW_ID, owner: "outro" },
        error: null,
      });
      const select = vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle })),
      }));
      const client: Client = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: OWNER_ID } },
            error: null,
          }),
        },
        from: vi.fn(() => ({ select })),
      };
      const route = await loadRoute(client);
      const res = await route.PATCH(
        new Request("http://localhost", {
          method: "PATCH",
          body: JSON.stringify({ completed: true }),
        }),
        { params: Promise.resolve({ id: ROW_ID }) },
      );
      expect(res.status).toBe(403);
      expect(select).toHaveBeenCalledWith("id, owner");
    });

    it("atualiza completed quando owner confere", async () => {
      const maybeSingle = vi.fn().mockResolvedValue({
        data: { id: ROW_ID, owner: OWNER_ID },
        error: null,
      });
      const select = vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle })),
      }));
      const innerEq = vi.fn().mockResolvedValue({ error: null });
      const outerEq = vi.fn(() => ({ eq: innerEq }));
      const update = vi.fn(() => ({ eq: outerEq }));

      let phase = 0;
      const client: Client = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: OWNER_ID } },
            error: null,
          }),
        },
        from: vi.fn(() => {
          phase += 1;
          return phase === 1 ? { select } : { update };
        }),
      };

      const route = await loadRoute(client);
      const res = await route.PATCH(
        new Request("http://localhost", {
          method: "PATCH",
          body: JSON.stringify({ completed: true }),
        }),
        { params: Promise.resolve({ id: ROW_ID }) },
      );

      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ ok: true });
      expect(update).toHaveBeenCalledWith({ completed: true });
      expect(outerEq).toHaveBeenCalledWith("id", ROW_ID);
      expect(innerEq).toHaveBeenCalledWith("owner", OWNER_ID);
    });
  });
});
