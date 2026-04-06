import { describe, expect, it, vi } from "vitest";

type ClientMock = {
  auth: { getUser: ReturnType<typeof vi.fn> };
  from: ReturnType<typeof vi.fn>;
  rpc: ReturnType<typeof vi.fn>;
};

function buildShelfBooksSelect(rows: { book_id: string }[]) {
  const order = vi.fn().mockResolvedValue({ data: rows, error: null });
  const eq = vi.fn(() => ({ order }));
  const select = vi.fn(() => ({ eq }));
  return { select, eq, order };
}

async function loadRoute() {
  vi.resetModules();
  return import("./route");
}

describe("POST /api/shelves/[id]/books/reorder", () => {
  it("returns 401 when unauthenticated", async () => {
    const client: ClientMock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
      from: vi.fn(),
      rpc: vi.fn(),
    };

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { POST } = await loadRoute();
    const res = await POST(
      new Request("http://localhost/api/shelves/s1/books/reorder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          bookIds: [
            "00000000-0000-4000-8000-000000000001",
            "00000000-0000-4000-8000-000000000002",
          ],
        }),
      }),
      { params: { id: "s1" } },
    );

    expect(res.status).toBe(401);
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it("calls reorder RPC when payload matches shelf books", async () => {
    const idA = "00000000-0000-4000-8000-000000000001";
    const idB = "00000000-0000-4000-8000-000000000002";
    const shelfBooks = buildShelfBooksSelect([
      { book_id: idA },
      { book_id: idB },
    ]);

    const client: ClientMock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: vi.fn(() => shelfBooks),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue(client),
    }));

    const { POST } = await loadRoute();
    const res = await POST(
      new Request("http://localhost/api/shelves/s1/books/reorder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookIds: [idB, idA] }),
      }),
      { params: { id: "s1" } },
    );

    expect(res.status).toBe(200);
    expect(client.rpc).toHaveBeenCalledWith("reorder_custom_shelf_books", {
      p_shelf_id: "s1",
      p_book_ids: [idB, idA],
    });
  });
});
