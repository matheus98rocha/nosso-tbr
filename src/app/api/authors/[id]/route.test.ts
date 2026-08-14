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

describe("/api/authors/[id]", () => {
  describe("RN47 — PATCH", () => {
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
        { params: Promise.resolve({ id: "auth-1" }) },
      );
      expect(res.status).toBe(401);
    });

    it("atualiza authors.eq(id)", async () => {
      const eq = vi.fn().mockResolvedValue({ error: null });
      const update = vi.fn(() => ({ eq }));
      const client: Client = {
        auth: authLogged("u1"),
        from: vi.fn(() => ({ update })),
      };
      const route = await loadRoute(client);
      const res = await route.PATCH(
        new Request("http://localhost", {
          method: "PATCH",
          body: JSON.stringify({ name: "Novo" }),
        }),
        { params: Promise.resolve({ id: "auth-1" }) },
      );
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ ok: true });
      expect(update).toHaveBeenCalledWith({ name: "Novo" });
      expect(eq).toHaveBeenCalledWith("id", "auth-1");
    });
  });

  describe("RN47 — DELETE bloqueado se referenciado", () => {
    it("retorna 403 quando há livro com author_id", async () => {
      const maybeSingleBooks = vi.fn().mockResolvedValue({
        data: { id: "b1" },
        error: null,
      });
      const booksChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            limit: vi.fn(() => ({ maybeSingle: maybeSingleBooks })),
          })),
        })),
      };
      const baChain = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            limit: vi.fn(() => ({
              maybeSingle: vi
                .fn()
                .mockResolvedValue({ data: null, error: null }),
            })),
          })),
        })),
      };
      const client: Client = {
        auth: authLogged("u1"),
        from: vi.fn((table: string) => {
          if (table === "books") return booksChain;
          if (table === "book_authors") return baChain;
          throw new Error(`unexpected ${table}`);
        }),
      };
      const route = await loadRoute(client);
      const res = await route.DELETE(new Request("http://localhost"), {
        params: Promise.resolve({ id: "auth-1" }),
      });
      expect(res.status).toBe(403);
      await expect(res.json()).resolves.toMatchObject({
        error: expect.stringContaining("referenciado"),
      });
      expect(client.from).toHaveBeenCalledWith("books");
    });

    it("remove autor quando não há books nem book_authors", async () => {
      const emptyBook = vi.fn().mockResolvedValue({ data: null, error: null });
      const emptyBa = vi.fn().mockResolvedValue({ data: null, error: null });
      const eqDel = vi.fn().mockResolvedValue({ error: null });

      const client: Client = {
        auth: authLogged("u1"),
        from: vi.fn((table: string) => {
          if (table === "books") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  limit: vi.fn(() => ({ maybeSingle: emptyBook })),
                })),
              })),
            };
          }
          if (table === "book_authors") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  limit: vi.fn(() => ({ maybeSingle: emptyBa })),
                })),
              })),
            };
          }
          if (table === "authors") {
            return {
              delete: vi.fn(() => ({ eq: eqDel })),
            };
          }
          throw new Error(table);
        }),
      };

      const route = await loadRoute(client);
      const res = await route.DELETE(new Request("http://localhost"), {
        params: Promise.resolve({ id: "auth-9" }),
      });
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ ok: true });
      expect(eqDel).toHaveBeenCalledWith("id", "auth-9");
    });
  });
});
