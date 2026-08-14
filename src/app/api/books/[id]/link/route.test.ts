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

describe("POST /api/books/[id]/link", () => {
  describe("RN48 — sessão", () => {
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
      const res = await route.POST(new Request("http://localhost"), {
        params: Promise.resolve({ id: "book-1" }),
      });
      expect(res.status).toBe(401);
      expect(client.from).not.toHaveBeenCalled();
    });
  });

  describe("contrato Supabase — readers", () => {
    it("retorna 404 quando livro não existe", async () => {
      const single = vi
        .fn()
        .mockResolvedValue({ data: null, error: { message: "none" } });
      const eq = vi.fn(() => ({ single }));
      const select = vi.fn(() => ({ eq }));
      const client: Client = {
        auth: authLogged("u1"),
        from: vi.fn(() => ({ select })),
      };
      const route = await loadRoute(client);
      const res = await route.POST(new Request("http://localhost"), {
        params: Promise.resolve({ id: "missing" }),
      });
      expect(res.status).toBe(404);
      expect(client.from).toHaveBeenCalledWith("books");
      expect(select).toHaveBeenCalledWith("id,readers");
      expect(eq).toHaveBeenCalledWith("id", "missing");
    });

    it("mescla readers existentes com auth.uid deduplicando e atualiza por id", async () => {
      const single = vi.fn().mockResolvedValue({
        data: { id: "b1", readers: ["u0", "u1"] },
        error: null,
      });
      const eqSel = vi.fn(() => ({ single }));
      const select = vi.fn(() => ({ eq: eqSel }));

      const eqUp = vi.fn().mockResolvedValue({ error: null });
      const update = vi.fn(() => ({ eq: eqUp }));

      let booksCalls = 0;
      const client: Client = {
        auth: authLogged("u1"),
        from: vi.fn(() => {
          booksCalls += 1;
          if (booksCalls === 1) return { select };
          return { update };
        }),
      };

      const route = await loadRoute(client);
      const res = await route.POST(new Request("http://localhost"), {
        params: Promise.resolve({ id: "b1" }),
      });

      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ ok: true });
      expect(update).toHaveBeenCalledWith({
        readers: ["u0", "u1"],
      });
      expect(eqUp).toHaveBeenCalledWith("id", "b1");
    });

    it("normaliza readers ausentes para lista só com usuário atual", async () => {
      const single = vi.fn().mockResolvedValue({
        data: { id: "b1", readers: null },
        error: null,
      });
      const select = vi.fn(() => ({
        eq: vi.fn(() => ({ single })),
      }));
      const eqUp = vi.fn().mockResolvedValue({ error: null });
      const update = vi.fn(() => ({ eq: eqUp }));
      let n = 0;
      const client: Client = {
        auth: authLogged("u9"),
        from: vi.fn(() => {
          n += 1;
          return n === 1 ? { select } : { update };
        }),
      };
      const route = await loadRoute(client);
      const res = await route.POST(new Request("http://localhost"), {
        params: Promise.resolve({ id: "b1" }),
      });
      expect(res.status).toBe(200);
      expect(update).toHaveBeenCalledWith({ readers: ["u9"] });
    });

    it("retorna 500 quando update falha", async () => {
      const single = vi.fn().mockResolvedValue({
        data: { id: "b1", readers: [] },
        error: null,
      });
      const select = vi.fn(() => ({
        eq: vi.fn(() => ({ single })),
      }));
      const eqUp = vi.fn().mockResolvedValue({
        error: { message: "write failed" },
      });
      const update = vi.fn(() => ({ eq: eqUp }));
      let n = 0;
      const client: Client = {
        auth: authLogged("u1"),
        from: vi.fn(() => {
          n += 1;
          return n === 1 ? { select } : { update };
        }),
      };
      const route = await loadRoute(client);
      const res = await route.POST(new Request("http://localhost"), {
        params: Promise.resolve({ id: "b1" }),
      });
      expect(res.status).toBe(500);
      await expect(res.json()).resolves.toEqual({ error: "write failed" });
    });
  });
});
