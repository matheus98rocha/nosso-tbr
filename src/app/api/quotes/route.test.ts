import { describe, expect, it, vi } from "vitest";

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

describe("POST /api/quotes", () => {
  describe("RN43 / RN42 — participação no livro pai", () => {
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
          body: JSON.stringify({
            bookId: BOOK_ID,
            content: "Trecho",
          }),
        }),
      );
      expect(res.status).toBe(401);
      expect(client.from).not.toHaveBeenCalled();
    });

    it("retorna 403 quando usuário não participa do livro", async () => {
      const maybeSingle = vi.fn().mockResolvedValue({
        data: {
          user_id: "other",
          chosen_by: "other",
          readers: ["other"],
        },
        error: null,
      });
      const select = vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle })),
      }));
      const client: Client = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: USER_ID } },
            error: null,
          }),
        },
        from: vi.fn(() => ({ select })),
      };
      const route = await loadRoute(client);
      const res = await route.POST(
        new Request("http://localhost", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookId: BOOK_ID,
            content: "Trecho",
          }),
        }),
      );
      expect(res.status).toBe(403);
      expect(select).toHaveBeenCalledWith("user_id,chosen_by,readers");
    });

    it("insere quote quando usuário é chosen_by", async () => {
      const inserted = {
        id: "q1",
        book_id: BOOK_ID,
        content: "Trecho",
        page: null,
      };
      const maybeSingle = vi.fn().mockResolvedValue({
        data: {
          user_id: null,
          chosen_by: USER_ID,
          readers: [],
        },
        error: null,
      });
      const select = vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle })),
      }));
      const single = vi.fn().mockResolvedValue({ data: inserted, error: null });
      const selectIns = vi.fn(() => ({ single }));
      const insert = vi.fn(() => ({ select: selectIns }));

      let step = 0;
      const client: Client = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: USER_ID } },
            error: null,
          }),
        },
        from: vi.fn(() => {
          step += 1;
          return step === 1 ? { select } : { insert };
        }),
      };

      const route = await loadRoute(client);
      const res = await route.POST(
        new Request("http://localhost", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookId: BOOK_ID,
            content: "Trecho",
            page: 12,
          }),
        }),
      );

      expect(res.status).toBe(201);
      await expect(res.json()).resolves.toEqual(inserted);
      expect(client.from).toHaveBeenNthCalledWith(1, "books");
      expect(client.from).toHaveBeenNthCalledWith(2, "quotes");
      expect(insert).toHaveBeenCalledWith([
        expect.objectContaining({
          book_id: BOOK_ID,
          content: "Trecho",
          page: 12,
        }),
      ]);
    });
  });
});
