import { afterEach, describe, expect, it, vi } from "vitest";

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

function usersTier(tier: "admin" | "common_user") {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn().mockResolvedValue({
          data: { tier },
          error: null,
        }),
      })),
    })),
  };
}

async function loadRoute(client: Client) {
  vi.resetModules();
  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue(client),
  }));
  return import("./route");
}

describe("GET /api/admin/users", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unmock("@/lib/supabase/server");
  });

  it("retorna 403 para common_user", async () => {
    const client: Client = {
      auth: authLogged("u-common"),
      from: vi.fn((table: string) => {
        if (table === "users") return usersTier("common_user");
        throw new Error(table);
      }),
    };
    const route = await loadRoute(client);
    const res = await route.GET();
    expect(res.status).toBe(403);
  });

  it("lista usuários para admin", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: "u1",
          display_name: "Ana",
          email: "ana@example.com",
          tier: "admin",
        },
      ],
      error: null,
    });
    const select = vi.fn(() => ({ order }));
    let usersCalls = 0;
    const client: Client = {
      auth: authLogged("u-admin"),
      from: vi.fn((table: string) => {
        if (table !== "users") throw new Error(table);
        usersCalls += 1;
        if (usersCalls === 1) return usersTier("admin");
        return { select };
      }),
    };
    const route = await loadRoute(client);
    const res = await route.GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual([
      {
        id: "u1",
        display_name: "Ana",
        email: "ana@example.com",
        tier: "admin",
      },
    ]);
    expect(select).toHaveBeenCalledWith("id, display_name, email, tier");
  });
});
