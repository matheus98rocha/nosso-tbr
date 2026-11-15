import { afterEach, describe, expect, it, vi } from "vitest";

type Client = {
  auth: {
    getUser: ReturnType<typeof vi.fn>;
    admin?: { deleteUser: ReturnType<typeof vi.fn> };
  };
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

function usersTable(options: {
  id: string;
  tier: "admin" | "common_user";
  adminCount?: number;
}) {
  return {
    select: vi.fn((_cols: string, opts?: { head?: boolean }) => {
      if (opts?.head) {
        return {
          eq: vi.fn().mockResolvedValue({
            count: options.adminCount ?? 1,
            error: null,
          }),
        };
      }
      return {
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: options.id, tier: options.tier },
            error: null,
          }),
        })),
      };
    }),
  };
}

const { createServiceRoleClientMock, deleteReaderAccountMock } = vi.hoisted(
  () => ({
    createServiceRoleClientMock: vi.fn(),
    deleteReaderAccountMock: vi.fn(),
  }),
);

async function loadRoute(sessionClient: Client, serviceClient?: Client) {
  vi.resetModules();
  deleteReaderAccountMock.mockReset();
  deleteReaderAccountMock.mockResolvedValue({ error: null });
  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue(sessionClient),
  }));
  vi.doMock("@/lib/supabase/serviceRole", () => ({
    createServiceRoleClient: createServiceRoleClientMock,
  }));
  vi.doMock("@/lib/users/deleteReaderAccount", () => ({
    deleteReaderAccount: deleteReaderAccountMock,
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

describe("DELETE /api/account", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unmock("@/lib/supabase/server");
    vi.unmock("@/lib/supabase/serviceRole");
    vi.unmock("@/lib/users/deleteReaderAccount");
  });

  it("retorna 401 sem sessão", async () => {
    const session: Client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
      from: vi.fn(),
    };
    const route = await loadRoute(session);
    const res = await route.DELETE(
      new Request("http://localhost", {
        method: "DELETE",
        body: JSON.stringify({ id: "someone-else" }),
      }),
    );
    expect(res.status).toBe(401);
    expect(deleteReaderAccountMock).not.toHaveBeenCalled();
  });

  it("retorna 503 sem service role", async () => {
    const route = await loadRoute({
      auth: authLogged("u-common"),
      from: vi.fn(),
    });
    const res = await route.DELETE(new Request("http://localhost"));
    expect(res.status).toBe(503);
    expect(deleteReaderAccountMock).not.toHaveBeenCalled();
  });

  it("exclui somente a própria conta e ignora um id no corpo", async () => {
    const service: Client = {
      auth: { getUser: vi.fn(), admin: { deleteUser: vi.fn() } },
      from: vi.fn((table: string) => {
        if (table !== "users") throw new Error(table);
        return usersTable({ id: "u-common", tier: "common_user" });
      }),
    };
    const route = await loadRoute(
      { auth: authLogged("u-common"), from: vi.fn() },
      service,
    );
    const res = await route.DELETE(
      new Request("http://localhost", {
        method: "DELETE",
        body: JSON.stringify({ id: "someone-else" }),
      }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(deleteReaderAccountMock).toHaveBeenCalledTimes(1);
    expect(deleteReaderAccountMock).toHaveBeenCalledWith(service, "u-common");
  });

  it("retorna 409 quando o próprio usuário é o último admin", async () => {
    const service: Client = {
      auth: { getUser: vi.fn(), admin: { deleteUser: vi.fn() } },
      from: vi.fn(),
    };
    const route = await loadRoute(
      { auth: authLogged("u-admin"), from: vi.fn() },
      service,
    );
    deleteReaderAccountMock.mockResolvedValue({
      error: "Não é possível excluir o último admin.",
      status: 409,
    });
    const res = await route.DELETE(new Request("http://localhost"));
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({
      error: expect.stringContaining("último admin"),
    });
    expect(deleteReaderAccountMock).toHaveBeenCalledWith(service, "u-admin");
  });

  it("permite que um admin exclua a própria conta quando há outro admin", async () => {
    const service: Client = {
      auth: { getUser: vi.fn(), admin: { deleteUser: vi.fn() } },
      from: vi.fn((table: string) => {
        if (table !== "users") throw new Error(table);
        return usersTable({ id: "u-admin", tier: "admin", adminCount: 2 });
      }),
    };
    const route = await loadRoute(
      { auth: authLogged("u-admin"), from: vi.fn() },
      service,
    );
    const res = await route.DELETE(new Request("http://localhost"));
    expect(res.status).toBe(200);
    expect(deleteReaderAccountMock).toHaveBeenCalledWith(service, "u-admin");
  });
});
