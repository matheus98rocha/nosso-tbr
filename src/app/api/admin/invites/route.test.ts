import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type SessionClient = {
  auth: { getUser: ReturnType<typeof vi.fn> };
  from: ReturnType<typeof vi.fn>;
};

type ServiceClient = {
  from: ReturnType<typeof vi.fn>;
};

function authLogged(userId: string): SessionClient["auth"] {
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

const { createServiceRoleClientMock } = vi.hoisted(() => ({
  createServiceRoleClientMock: vi.fn(),
}));

async function loadRoute(sessionClient: SessionClient, serviceClient?: ServiceClient) {
  vi.resetModules();

  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue(sessionClient),
  }));

  vi.doMock("@/lib/supabase/serviceRole", () => ({
    createServiceRoleClient: createServiceRoleClientMock,
  }));

  if (serviceClient) {
    createServiceRoleClientMock.mockReturnValue(serviceClient);
  } else {
    createServiceRoleClientMock.mockImplementation(() => {
      throw new Error("missing key");
    });
  }

  return import("./route");
}

describe("/api/admin/invites", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-07T12:00:00.000Z"));
    process.env.NEXT_PUBLIC_SITE_URL = "https://nosso-tbr.example";
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.NEXT_PUBLIC_SITE_URL;
    vi.resetModules();
    vi.unmock("@/lib/supabase/server");
    vi.unmock("@/lib/supabase/serviceRole");
  });

  describe("POST", () => {
    it("retorna 403 para common_user", async () => {
      const session: SessionClient = {
        auth: authLogged("u-common"),
        from: vi.fn((table: string) => {
          if (table === "users") return usersTier("common_user");
          throw new Error(table);
        }),
      };

      const route = await loadRoute(session, { from: vi.fn() });
      const res = await route.POST(new Request("http://localhost/api/admin/invites", { method: "POST" }));

      expect(res.status).toBe(403);
    });

    it("cria convite com expires_at ~24h e retorna inviteUrl", async () => {
      const expiresAt = new Date("2026-09-08T12:00:00.000Z");
      const createdAt = new Date("2026-09-07T12:00:00.000Z");
      const inviteRow = {
        id: "invite-1",
        token: "opaque-random-token",
        expires_at: expiresAt.toISOString(),
        created_at: createdAt.toISOString(),
      };

      const single = vi.fn().mockResolvedValue({ data: inviteRow, error: null });
      const select = vi.fn(() => ({ single }));
      const insert = vi.fn(() => ({ select }));
      const serviceFrom = vi.fn((table: string) => {
        if (table === "register_invites") return { insert };
        throw new Error(table);
      });

      let usersCalls = 0;
      const session: SessionClient = {
        auth: authLogged("u-admin"),
        from: vi.fn((table: string) => {
          if (table !== "users") throw new Error(table);
          usersCalls += 1;
          if (usersCalls === 1) return usersTier("admin");
          throw new Error("unexpected users call");
        }),
      };

      const route = await loadRoute(session, { from: serviceFrom });
      const res = await route.POST(new Request("http://localhost/api/admin/invites", { method: "POST" }));

      expect(res.status).toBe(201);
      await expect(res.json()).resolves.toEqual({
        invite: {
          id: "invite-1",
          token: "opaque-random-token",
          expires_at: expiresAt.toISOString(),
          created_at: createdAt.toISOString(),
        },
        inviteUrl:
          "https://nosso-tbr.example/register?invite=opaque-random-token",
      });

      expect(insert).toHaveBeenCalledWith(
        expect.objectContaining({
          token: expect.any(String),
          expires_at: expect.any(String),
          created_by: "u-admin",
        }),
      );

      const insertCalls = insert.mock.calls as unknown as Array<
        [{ expires_at: string }]
      >;
      const insertedArg = insertCalls[0]?.[0];
      expect(insertedArg).toBeDefined();
      const insertedExpiry = new Date(insertedArg!.expires_at).getTime();
      const expectedExpiry = new Date("2026-09-08T12:00:00.000Z").getTime();
      expect(Math.abs(insertedExpiry - expectedExpiry)).toBeLessThanOrEqual(60_000);
    });
  });

  describe("GET", () => {
    it("retorna 403 para common_user", async () => {
      const session: SessionClient = {
        auth: authLogged("u-common"),
        from: vi.fn((table: string) => {
          if (table === "users") return usersTier("common_user");
          throw new Error(table);
        }),
      };

      const route = await loadRoute(session, { from: vi.fn() });
      const res = await route.GET(new Request("http://localhost/api/admin/invites"));

      expect(res.status).toBe(403);
    });

    it("lista convites ativos com inviteUrl", async () => {
      const activeInvite = {
        id: "invite-active",
        token: "active-token",
        expires_at: "2026-09-08T12:00:00.000Z",
        created_at: "2026-09-07T10:00:00.000Z",
      };

      const order = vi.fn().mockResolvedValue({ data: [activeInvite], error: null });
      const gt = vi.fn(() => ({ order }));
      const select = vi.fn(() => ({ gt }));
      const serviceFrom = vi.fn((table: string) => {
        if (table === "register_invites") return { select };
        throw new Error(table);
      });

      let usersCalls = 0;
      const session: SessionClient = {
        auth: authLogged("u-admin"),
        from: vi.fn((table: string) => {
          if (table !== "users") throw new Error(table);
          usersCalls += 1;
          if (usersCalls === 1) return usersTier("admin");
          throw new Error("unexpected users call");
        }),
      };

      const route = await loadRoute(session, { from: serviceFrom });
      const res = await route.GET(new Request("http://localhost/api/admin/invites"));

      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({
        invites: [
          {
            id: "invite-active",
            token: "active-token",
            expires_at: "2026-09-08T12:00:00.000Z",
            created_at: "2026-09-07T10:00:00.000Z",
            inviteUrl: "https://nosso-tbr.example/register?invite=active-token",
          },
        ],
      });

      expect(select).toHaveBeenCalledWith("id, token, expires_at, created_at");
      expect(gt).toHaveBeenCalledWith("expires_at", "2026-09-07T12:00:00.000Z");
      expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
    });
  });
});
