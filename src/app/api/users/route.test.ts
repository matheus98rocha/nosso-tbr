import { describe, expect, it, vi } from "vitest";

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

describe("GET /api/users", () => {
  describe("RN18 / RN46 — lista para sessão autenticada", () => {
    it("retorna 401 quando não há usuário", async () => {
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
      const res = await route.GET();
      expect(res.status).toBe(401);
      expect(client.from).not.toHaveBeenCalled();
    });

    it("retorna usuários com select id, display_name e headers de cache", async () => {
      const rows = [
        { id: "u1", display_name: "A" },
        { id: "u2", display_name: "B" },
      ];
      const select = vi.fn().mockResolvedValue({ data: rows, error: null });
      const client: Client = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "me" } },
            error: null,
          }),
        },
        from: vi.fn(() => ({ select })),
      };
      const route = await loadRoute(client);
      const res = await route.GET();
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual(rows);
      expect(client.from).toHaveBeenCalledWith("users");
      expect(select).toHaveBeenCalledWith("id, display_name");
      expect(res.headers.get("Cache-Control")).toBe("no-store");
      expect(res.headers.get("x-nextjs-cache-tags")).toBe("users");
    });

    it("retorna 500 quando select falha", async () => {
      const select = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "db" },
      });
      const client: Client = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "me" } },
            error: null,
          }),
        },
        from: vi.fn(() => ({ select })),
      };
      const route = await loadRoute(client);
      const res = await route.GET();
      expect(res.status).toBe(500);
      await expect(res.json()).resolves.toEqual({ error: "db" });
    });
  });
});
