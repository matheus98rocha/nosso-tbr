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
  vi.doMock("@/lib/auth/registerInvite", () => ({
    default: {
      secretConfigured: () => true,
    },
  }));
  return import("./route");
}

describe("GET /api/admin/invite-link", () => {
  const originalSecret = process.env.REGISTER_INVITE_SECRET;
  const originalSite = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    process.env.REGISTER_INVITE_SECRET = originalSecret;
    process.env.NEXT_PUBLIC_SITE_URL = originalSite;
    vi.resetModules();
    vi.unmock("@/lib/supabase/server");
    vi.unmock("@/lib/auth/registerInvite");
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
    const res = await route.GET(new Request("http://localhost/api/admin/invite-link"));
    expect(res.status).toBe(403);
  });

  it("retorna inviteUrl para admin", async () => {
    process.env.REGISTER_INVITE_SECRET = "secret-token";
    process.env.NEXT_PUBLIC_SITE_URL = "https://nosso-tbr.example";
    const client: Client = {
      auth: authLogged("u-admin"),
      from: vi.fn((table: string) => {
        if (table === "users") return usersTier("admin");
        throw new Error(table);
      }),
    };
    const route = await loadRoute(client);
    const res = await route.GET(new Request("http://localhost/api/admin/invite-link"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      configured: true,
      inviteUrl: "https://nosso-tbr.example/register?invite=secret-token",
    });
  });
});
