import { describe, expect, it, vi } from "vitest";

type SupabaseByIdMock = {
  auth: { getUser: ReturnType<typeof vi.fn> };
  from: ReturnType<typeof vi.fn>;
};

const validPatchPayload = {
  title: "Livro Seguro",
  author_id: "author-1",
  chosen_by: "owner-user",
  pages: 123,
  readers: ["owner-user"],
  status: "reading" as const,
};

function buildBookSelectSingle(row: unknown) {
  const single = vi.fn().mockResolvedValue({ data: row, error: null });
  const eq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq }));

  return { select, eq, single };
}

function buildBookSelectMaybeSingle(row: unknown) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null });
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));

  return { select, eq, maybeSingle };
}

async function loadRouteWithClient(client: SupabaseByIdMock) {
  vi.resetModules();

  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue(client),
  }));

  return import("./route");
}

describe("/api/books/[id] security", () => {
  it("PATCH returns 403 and does not call update for non-participant user", async () => {
    const currentBook = {
      id: "book-1",
      status: "reading",
      start_date: null,
      end_date: null,
      user_id: "owner-user",
      chosen_by: "owner-user",
      readers: ["owner-user"],
    };

    const readBuilder = buildBookSelectSingle(currentBook);
    const update = vi.fn();
    const client: SupabaseByIdMock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "intruder-user" } },
          error: null,
        }),
      },
      from: vi.fn(() => ({
        select: readBuilder.select,
        update,
      })),
    };

    const route = await loadRouteWithClient(client);
    const response = await route.PATCH(
      new Request("http://localhost/api/books/book-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validPatchPayload),
      }),
      { params: Promise.resolve({ id: "book-1" }) },
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
    expect(update).not.toHaveBeenCalled();
  });

  it("DELETE returns 403 and does not call delete for non-participant user", async () => {
    const row = {
      user_id: "owner-user",
      chosen_by: "owner-user",
      readers: ["owner-user"],
    };

    const readBuilder = buildBookSelectMaybeSingle(row);
    const deleteFn = vi.fn();
    const client: SupabaseByIdMock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "intruder-user" } },
          error: null,
        }),
      },
      from: vi.fn(() => ({
        select: readBuilder.select,
        delete: deleteFn,
      })),
    };

    const route = await loadRouteWithClient(client);
    const response = await route.DELETE(
      new Request("http://localhost/api/books/book-1", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "book-1" }) },
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
    expect(deleteFn).not.toHaveBeenCalled();
  });
});
