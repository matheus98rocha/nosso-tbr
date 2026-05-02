import { describe, expect, it, vi } from "vitest";

const BOOK_ID = "550e8400-e29b-41d4-a716-446655440001";
const OWNER_ID = "660e8400-e29b-41d4-a716-446655440002";
const OTHER_OWNER = "660e8400-e29b-41d4-a716-446655440099";

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

describe("/api/schedule", () => {
  describe("RN44 / RN42 — POST", () => {
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
          body: JSON.stringify({
            schedules: [
              {
                book_id: BOOK_ID,
                owner: OWNER_ID,
                date: "2025-06-01",
                chapters: "Cap 1",
              },
            ],
          }),
        }),
      );
      expect(res.status).toBe(401);
      expect(client.from).not.toHaveBeenCalled();
    });

    it("retorna 403 quando owner não é o usuário autenticado", async () => {
      const client: Client = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: OWNER_ID } },
            error: null,
          }),
        },
        from: vi.fn(),
      };
      const route = await loadRoute(client);
      const res = await route.POST(
        new Request("http://localhost", {
          method: "POST",
          body: JSON.stringify({
            schedules: [
              {
                book_id: BOOK_ID,
                owner: OTHER_OWNER,
                date: "2025-06-01",
                chapters: "Cap 1",
              },
            ],
          }),
        }),
      );
      expect(res.status).toBe(403);
      expect(client.from).not.toHaveBeenCalled();
    });

    it("retorna 403 quando não participa do livro", async () => {
      const maybeSingle = vi.fn().mockResolvedValue({
        data: {
          user_id: "x",
          chosen_by: "x",
          readers: ["x"],
        },
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
      const res = await route.POST(
        new Request("http://localhost", {
          method: "POST",
          body: JSON.stringify({
            schedules: [
              {
                book_id: BOOK_ID,
                owner: OWNER_ID,
                date: "2025-06-01",
                chapters: "Cap 1",
              },
            ],
          }),
        }),
      );
      expect(res.status).toBe(403);
      expect(select).toHaveBeenCalledWith("user_id,chosen_by,readers");
    });

    it("insere linhas em schedule após validar participação", async () => {
      const maybeSingle = vi.fn().mockResolvedValue({
        data: {
          user_id: OWNER_ID,
          chosen_by: OWNER_ID,
          readers: [OWNER_ID],
        },
        error: null,
      });
      const select = vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle })),
      }));
      const insert = vi.fn().mockResolvedValue({ error: null });

      const client: Client = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: OWNER_ID } },
            error: null,
          }),
        },
        from: vi.fn((table: string) => {
          if (table === "books") {
            return { select };
          }
          if (table === "schedule") {
            return { insert };
          }
          throw new Error(table);
        }),
      };

      const route = await loadRoute(client);
      const res = await route.POST(
        new Request("http://localhost", {
          method: "POST",
          body: JSON.stringify({
            schedules: [
              {
                book_id: BOOK_ID,
                owner: OWNER_ID,
                date: "2025-06-01",
                chapters: ["a", "b"],
              },
            ],
          }),
        }),
      );

      expect(res.status).toBe(201);
      await expect(res.json()).resolves.toEqual({ ok: true });
      expect(insert).toHaveBeenCalledTimes(1);
      expect(insert.mock.calls[0][0]).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            book_id: BOOK_ID,
            owner: OWNER_ID,
            chapters: "a, b",
          }),
        ]),
      );
    });
  });

  describe("RN44 — DELETE por bookId", () => {
    it("retorna 400 sem bookId na query", async () => {
      const client: Client = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: OWNER_ID } },
            error: null,
          }),
        },
        from: vi.fn(),
      };
      const route = await loadRoute(client);
      const res = await route.DELETE(new Request("http://localhost/api/schedule"));
      expect(res.status).toBe(400);
      expect(client.from).not.toHaveBeenCalled();
    });

    it("deleta agenda do owner para o livro informado", async () => {
      const eqOwner = vi.fn().mockResolvedValue({ error: null });
      const eqBook = vi.fn(() => ({ eq: eqOwner }));
      const del = vi.fn(() => ({ eq: eqBook }));
      const client: Client = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: OWNER_ID } },
            error: null,
          }),
        },
        from: vi.fn(() => ({ delete: del })),
      };
      const route = await loadRoute(client);
      const res = await route.DELETE(
        new Request(`http://localhost/api/schedule?bookId=${BOOK_ID}`),
      );
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ ok: true });
      expect(del).toHaveBeenCalled();
      expect(eqBook).toHaveBeenCalledWith("book_id", BOOK_ID);
      expect(eqOwner).toHaveBeenCalledWith("owner", OWNER_ID);
    });
  });
});
