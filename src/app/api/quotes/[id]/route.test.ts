import { describe, expect, it, vi } from "vitest";

const BOOK_ID = "550e8400-e29b-41d4-a716-446655440001";
const QUOTE_ID = "770e8400-e29b-41d4-a716-446655440003";
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

describe("/api/quotes/[id]", () => {
  describe("RN43 — PATCH", () => {
    it("retorna 404 quando quote não existe", async () => {
      const maybeQuote = vi.fn().mockResolvedValue({ data: null, error: null });
      const selectQ = vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: maybeQuote })),
      }));
      const client: Client = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: USER_ID } },
            error: null,
          }),
        },
        from: vi.fn(() => ({ select: selectQ })),
      };
      const route = await loadRoute(client);
      const res = await route.PATCH(
        new Request("http://localhost", {
          method: "PATCH",
          body: JSON.stringify({ content: "X" }),
        }),
        { params: Promise.resolve({ id: QUOTE_ID }) },
      );
      expect(res.status).toBe(404);
      expect(client.from).toHaveBeenCalledWith("quotes");
    });

    it("retorna 403 quando não participa do livro pai", async () => {
      const maybeQuote = vi.fn().mockResolvedValue({
        data: { id: QUOTE_ID, book_id: BOOK_ID },
        error: null,
      });
      const maybeBook = vi.fn().mockResolvedValue({
        data: {
          user_id: "z",
          chosen_by: "z",
          readers: ["z"],
        },
        error: null,
      });
      let tableCalls = 0;
      const client: Client = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: USER_ID } },
            error: null,
          }),
        },
        from: vi.fn((table: string) => {
          tableCalls += 1;
          if (table === "quotes") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({ maybeSingle: maybeQuote })),
              })),
            };
          }
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({ maybeSingle: maybeBook })),
            })),
          };
        }),
      };
      const route = await loadRoute(client);
      const res = await route.PATCH(
        new Request("http://localhost", {
          method: "PATCH",
          body: JSON.stringify({ content: "Editado" }),
        }),
        { params: Promise.resolve({ id: QUOTE_ID }) },
      );
      expect(res.status).toBe(403);
    });

    it("atualiza quote quando participação válida", async () => {
      const maybeQuote = vi.fn().mockResolvedValue({
        data: { id: QUOTE_ID, book_id: BOOK_ID },
        error: null,
      });
      const maybeBook = vi.fn().mockResolvedValue({
        data: {
          user_id: null,
          chosen_by: USER_ID,
          readers: [],
        },
        error: null,
      });

      const updatedRow = {
        id: QUOTE_ID,
        content: "Novo",
        page: 3,
      };
      const single = vi.fn().mockResolvedValue({
        data: updatedRow,
        error: null,
      });
      const selectAfterUp = vi.fn(() => ({ single }));
      const eqAfterUp = vi.fn(() => ({ select: selectAfterUp }));
      const update = vi.fn(() => ({ eq: eqAfterUp }));

      let phase = 0;
      const client: Client = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: USER_ID } },
            error: null,
          }),
        },
        from: vi.fn((table: string) => {
          if (table === "quotes") {
            phase += 1;
            if (phase === 1) {
              return {
                select: vi.fn(() => ({
                  eq: vi.fn(() => ({ maybeSingle: maybeQuote })),
                })),
              };
            }
            return { update };
          }
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({ maybeSingle: maybeBook })),
            })),
          };
        }),
      };

      const route = await loadRoute(client);
      const res = await route.PATCH(
        new Request("http://localhost", {
          method: "PATCH",
          body: JSON.stringify({ content: "Novo", page: 3 }),
        }),
        { params: Promise.resolve({ id: QUOTE_ID }) },
      );

      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual(updatedRow);
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({ content: "Novo", page: 3 }),
      );
      expect(eqAfterUp).toHaveBeenCalledWith("id", QUOTE_ID);
    });
  });

  describe("RN43 — DELETE", () => {
    it("remove quote quando participação válida", async () => {
      const maybeQuote = vi.fn().mockResolvedValue({
        data: { id: QUOTE_ID, book_id: BOOK_ID },
        error: null,
      });
      const maybeBook = vi.fn().mockResolvedValue({
        data: {
          user_id: null,
          chosen_by: USER_ID,
          readers: [],
        },
        error: null,
      });
      const eqDel = vi.fn().mockResolvedValue({ error: null });
      const del = vi.fn(() => ({ eq: eqDel }));

      let quotesPhase = 0;
      const client: Client = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: USER_ID } },
            error: null,
          }),
        },
        from: vi.fn((table: string) => {
          if (table === "quotes") {
            quotesPhase += 1;
            if (quotesPhase === 1) {
              return {
                select: vi.fn(() => ({
                  eq: vi.fn(() => ({ maybeSingle: maybeQuote })),
                })),
              };
            }
            return { delete: del };
          }
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({ maybeSingle: maybeBook })),
            })),
          };
        }),
      };

      const route = await loadRoute(client);
      const res = await route.DELETE(new Request("http://localhost"), {
        params: Promise.resolve({ id: QUOTE_ID }),
      });

      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ ok: true });
      expect(eqDel).toHaveBeenCalledWith("id", QUOTE_ID);
    });
  });
});
