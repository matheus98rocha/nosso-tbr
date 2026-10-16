import { describe, expect, it, vi } from "vitest";

type Client = {
  auth: { getUser: ReturnType<typeof vi.fn> };
  from: ReturnType<typeof vi.fn>;
  rpc: ReturnType<typeof vi.fn>;
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
        rpc: vi.fn(),
      };
      const route = await loadRoute(client);
      const res = await route.POST(new Request("http://localhost"), {
        params: Promise.resolve({ id: "book-1" }),
      });
      expect(res.status).toBe(401);
      expect(client.from).not.toHaveBeenCalled();
      expect(client.rpc).not.toHaveBeenCalled();
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
        rpc: vi.fn(),
      };
      const route = await loadRoute(client);
      const res = await route.POST(new Request("http://localhost"), {
        params: Promise.resolve({ id: "missing" }),
      });
      expect(res.status).toBe(404);
      expect(client.from).toHaveBeenCalledWith("books");
      expect(select).toHaveBeenCalledWith("id");
      expect(eq).toHaveBeenCalledWith("id", "missing");
      expect(client.rpc).not.toHaveBeenCalled();
    });

    it("entra na leitura pela função que acrescenta o leitor atual", async () => {
      const single = vi.fn().mockResolvedValue({
        data: { id: "b1" },
        error: null,
      });
      const eqSel = vi.fn(() => ({ single }));
      const select = vi.fn(() => ({ eq: eqSel }));
      const update = vi.fn();
      const client: Client = {
        auth: authLogged("u1"),
        from: vi.fn(() => ({ select, update })),
        rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
      };

      const route = await loadRoute(client);
      const res = await route.POST(new Request("http://localhost"), {
        params: Promise.resolve({ id: "b1" }),
      });

      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ ok: true });
      expect(update).not.toHaveBeenCalled();
      expect(client.rpc).toHaveBeenCalledWith("link_current_reader_to_book", {
        p_book_id: "b1",
      });
    });

    it("recusa quando a leitura não pode receber o leitor", async () => {
      const single = vi.fn().mockResolvedValue({
        data: { id: "b1" },
        error: null,
      });
      const select = vi.fn(() => ({
        eq: vi.fn(() => ({ single })),
      }));
      const update = vi.fn();
      const client: Client = {
        auth: authLogged("u9"),
        from: vi.fn(() => ({ select, update })),
        rpc: vi.fn().mockResolvedValue({ data: false, error: null }),
      };
      const route = await loadRoute(client);
      const res = await route.POST(new Request("http://localhost"), {
        params: Promise.resolve({ id: "b1" }),
      });
      expect(res.status).toBe(403);
      await expect(res.json()).resolves.toEqual({ error: "Forbidden" });
      expect(update).not.toHaveBeenCalled();
    });

    it("retorna 500 quando a função falha", async () => {
      const single = vi.fn().mockResolvedValue({
        data: { id: "b1" },
        error: null,
      });
      const select = vi.fn(() => ({
        eq: vi.fn(() => ({ single })),
      }));
      const client: Client = {
        auth: authLogged("u1"),
        from: vi.fn(() => ({ select })),
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "write failed" },
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
