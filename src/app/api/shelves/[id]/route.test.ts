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

describe("/api/shelves/[id]", () => {
  describe("RN45 — PATCH custom_shelves dono", () => {
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
      const res = await route.PATCH(
        new Request("http://localhost", {
          method: "PATCH",
          body: JSON.stringify({ name: "X" }),
        }),
        { params: Promise.resolve({ id: "s1" }) },
      );
      expect(res.status).toBe(401);
      expect(client.from).not.toHaveBeenCalled();
    });

    it("retorna 400 com JSON inválido ou nome inválido", async () => {
      const client: Client = {
        auth: authLogged("owner"),
        from: vi.fn(),
      };
      const route = await loadRoute(client);
      const badJson = await route.PATCH(
        new Request("http://localhost", {
          method: "PATCH",
          body: "not-json",
        }),
        { params: Promise.resolve({ id: "s1" }) },
      );
      expect(badJson.status).toBe(400);

      const badName = await route.PATCH(
        new Request("http://localhost", {
          method: "PATCH",
          body: JSON.stringify({ name: "" }),
        }),
        { params: Promise.resolve({ id: "s1" }) },
      );
      expect(badName.status).toBe(400);
      expect(client.from).not.toHaveBeenCalled();
    });

    it("retorna 403 quando shelf pertence a outro usuário", async () => {
      const maybeSingle = vi.fn().mockResolvedValue({
        data: { id: "s1", user_id: "other" },
        error: null,
      });
      const select = vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle })),
      }));
      const client: Client = {
        auth: authLogged("me"),
        from: vi.fn(() => ({ select })),
      };
      const route = await loadRoute(client);
      const res = await route.PATCH(
        new Request("http://localhost", {
          method: "PATCH",
          body: JSON.stringify({ name: "Nova" }),
        }),
        { params: Promise.resolve({ id: "s1" }) },
      );
      expect(res.status).toBe(403);
      expect(client.from).toHaveBeenCalledWith("custom_shelves");
      expect(select).toHaveBeenCalledWith("id, user_id");
    });

    it("retorna 404 quando estante não existe", async () => {
      const maybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const select = vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle })),
      }));
      const client: Client = {
        auth: authLogged("me"),
        from: vi.fn(() => ({ select })),
      };
      const route = await loadRoute(client);
      const res = await route.PATCH(
        new Request("http://localhost", {
          method: "PATCH",
          body: JSON.stringify({ name: "Nova" }),
        }),
        { params: Promise.resolve({ id: "missing" }) },
      );
      expect(res.status).toBe(404);
    });

    it("atualiza nome quando dono confere", async () => {
      const maybeSingle = vi.fn().mockResolvedValue({
        data: { id: "s1", user_id: "owner" },
        error: null,
      });
      const eqUpdate = vi.fn().mockResolvedValue({ error: null });
      const update = vi.fn(() => ({ eq: eqUpdate }));
      const select = vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle })),
      }));
      let phase = 0;
      const client: Client = {
        auth: authLogged("owner"),
        from: vi.fn(() => {
          phase += 1;
          return phase === 1 ? { select } : { update };
        }),
      };
      const route = await loadRoute(client);
      const res = await route.PATCH(
        new Request("http://localhost", {
          method: "PATCH",
          body: JSON.stringify({ name: "Renomeada" }),
        }),
        { params: Promise.resolve({ id: "s1" }) },
      );
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ ok: true });
      expect(update).toHaveBeenCalledWith({ name: "Renomeada" });
      expect(eqUpdate).toHaveBeenCalledWith("id", "s1");
    });
  });

  describe("RN45 — DELETE custom_shelves", () => {
    it("retorna 403 quando não é dono", async () => {
      const maybeSingle = vi.fn().mockResolvedValue({
        data: { id: "s1", user_id: "other" },
        error: null,
      });
      const select = vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle })),
      }));
      const client: Client = {
        auth: authLogged("me"),
        from: vi.fn(() => ({ select })),
      };
      const route = await loadRoute(client);
      const res = await route.DELETE(new Request("http://localhost"), {
        params: Promise.resolve({ id: "s1" }),
      });
      expect(res.status).toBe(403);
    });

    it("remove linha quando dono confere", async () => {
      const maybeSingle = vi.fn().mockResolvedValue({
        data: { id: "s1", user_id: "owner" },
        error: null,
      });
      const select = vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle })),
      }));
      const eqDel = vi.fn().mockResolvedValue({ error: null });
      const del = vi.fn(() => ({ eq: eqDel }));
      let phase = 0;
      const client: Client = {
        auth: authLogged("owner"),
        from: vi.fn(() => {
          phase += 1;
          return phase === 1 ? { select } : { delete: del };
        }),
      };
      const route = await loadRoute(client);
      const res = await route.DELETE(new Request("http://localhost"), {
        params: Promise.resolve({ id: "s1" }),
      });
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ ok: true });
      expect(del).toHaveBeenCalled();
      expect(eqDel).toHaveBeenCalledWith("id", "s1");
    });
  });
});
