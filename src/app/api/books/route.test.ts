import { describe, expect, it, vi } from "vitest";

type SupabasePostMock = {
  auth: { getUser: ReturnType<typeof vi.fn> };
  from: ReturnType<typeof vi.fn>;
};

const validPayload = {
  title: "Livro Seguro",
  author_id: "author-1",
  chosen_by: "user-owner",
  pages: 123,
  readers: ["user-owner"],
  status: "reading" as const,
};

async function loadRouteWithClient(client: SupabasePostMock) {
  vi.resetModules();

  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue(client),
  }));

  return import("./route");
}

describe("POST /api/books security", () => {
  it("returns 403 and does not insert when authenticated user is not a participant", async () => {
    const insert = vi.fn();
    const client: SupabasePostMock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "intruder-user" } },
          error: null,
        }),
      },
      from: vi.fn(() => ({ insert })),
    };

    const route = await loadRouteWithClient(client);

    const response = await route.POST(
      new Request("http://localhost/api/books", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validPayload),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
    expect(insert).not.toHaveBeenCalled();
  });
});
