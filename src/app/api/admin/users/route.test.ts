import { afterEach, describe, expect, it, vi } from "vitest";

type SessionClient = {
  auth: { getUser: ReturnType<typeof vi.fn> };
  from: ReturnType<typeof vi.fn>;
};

type ServiceClient = {
  from: ReturnType<typeof vi.fn>;
  auth: {
    admin: {
      listUsers: ReturnType<typeof vi.fn>;
    };
  };
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

async function loadRoute(
  sessionClient: SessionClient,
  serviceClient?: ServiceClient,
) {
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

describe("GET /api/admin/users", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unmock("@/lib/supabase/server");
    vi.unmock("@/lib/supabase/serviceRole");
  });

  it("retorna 403 para common_user", async () => {
    const session: SessionClient = {
      auth: authLogged("u-common"),
      from: vi.fn((table: string) => {
        if (table === "users") return usersTier("common_user");
        throw new Error(table);
      }),
    };
    const route = await loadRoute(session);
    const res = await route.GET();
    expect(res.status).toBe(403);
  });

  it("retorna 503 quando service role não está configurada", async () => {
    const session: SessionClient = {
      auth: authLogged("u-admin"),
      from: vi.fn((table: string) => {
        if (table === "users") return usersTier("admin");
        throw new Error(table);
      }),
    };
    const route = await loadRoute(session);
    const res = await route.GET();
    expect(res.status).toBe(503);
  });

  it("lista usuários com livros cadastrados e último acesso para admin", async () => {
    const usersOrder = vi.fn().mockResolvedValue({
      data: [
        {
          id: "u1",
          display_name: "Ana",
          email: "ana@example.com",
          tier: "admin",
        },
        {
          id: "u2",
          display_name: "Bruno",
          email: "bruno@example.com",
          tier: "common_user",
        },
      ],
      error: null,
    });
    const usersSelect = vi.fn(() => ({ order: usersOrder }));

    const booksSelect = vi.fn().mockResolvedValue({
      data: [
        { chosen_by: "u1" },
        { chosen_by: "u1" },
        { chosen_by: "u2" },
      ],
      error: null,
    });

    const listUsers = vi.fn().mockResolvedValue({
      data: {
        users: [
          { id: "u1", last_sign_in_at: "2026-09-10T18:00:00.000Z" },
          { id: "u2", last_sign_in_at: null },
        ],
      },
      error: null,
    });

    const serviceClient: ServiceClient = {
      from: vi.fn((table: string) => {
        if (table === "users") return { select: usersSelect };
        if (table === "books") return { select: booksSelect };
        throw new Error(table);
      }),
      auth: {
        admin: {
          listUsers,
        },
      },
    };

    const session: SessionClient = {
      auth: authLogged("u-admin"),
      from: vi.fn((table: string) => {
        if (table === "users") return usersTier("admin");
        throw new Error(table);
      }),
    };

    const route = await loadRoute(session, serviceClient);
    const res = await route.GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual([
      {
        id: "u1",
        display_name: "Ana",
        email: "ana@example.com",
        tier: "admin",
        books_count: 2,
        last_sign_in_at: "2026-09-10T18:00:00.000Z",
      },
      {
        id: "u2",
        display_name: "Bruno",
        email: "bruno@example.com",
        tier: "common_user",
        books_count: 1,
        last_sign_in_at: null,
      },
    ]);
    expect(usersSelect).toHaveBeenCalledWith("id, display_name, email, tier");
    expect(booksSelect).toHaveBeenCalledWith("chosen_by");
    expect(listUsers).toHaveBeenCalledWith({ page: 1, perPage: 1000 });
  });
});
