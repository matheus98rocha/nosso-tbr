import { describe, expect, it, vi } from "vitest";

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

async function loadRoute(client: Client) {
  vi.resetModules();
  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue(client),
  }));
  return import("./route");
}

describe("POST /api/authors", () => {
  describe("RN47 / RN48 — criação autenticada", () => {
    it("retorna 401 sem usuário", async () => {
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
          body: JSON.stringify({ name: "Autor" }),
        }),
      );
      expect(res.status).toBe(401);
      expect(client.from).not.toHaveBeenCalled();
    });

    it("insere em authors com select id, name e retorna 201", async () => {
      const row = { id: "a1", name: "Clarice" };
      const single = vi.fn().mockResolvedValue({ data: row, error: null });
      const select = vi.fn(() => ({ single }));
      const insert = vi.fn(() => ({ select }));
      const client: Client = {
        auth: authLogged("u1"),
        from: vi.fn(() => ({ insert })),
      };
      const route = await loadRoute(client);
      const res = await route.POST(
        new Request("http://localhost", {
          method: "POST",
          body: JSON.stringify({ name: "Clarice" }),
        }),
      );
      expect(res.status).toBe(201);
      await expect(res.json()).resolves.toEqual(row);
      expect(client.from).toHaveBeenCalledWith("authors");
      expect(insert).toHaveBeenCalledWith({ name: "Clarice" });
      expect(select).toHaveBeenCalledWith("id, name");
    });
  });
});
