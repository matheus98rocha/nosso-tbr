import { afterEach, describe, expect, it, vi } from "vitest";

type SessionClient = {
  auth: { getUser: ReturnType<typeof vi.fn> };
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

function settingsClient(result: {
  data: { mode: string } | null;
  error?: { message: string } | null;
}) {
  const single = vi.fn().mockResolvedValue({
    data: result.data,
    error: result.error ?? null,
  });
  const upsert = vi.fn(() => ({
    select: vi.fn(() => ({ single })),
  }));

  return {
    from: vi.fn(() => ({
      upsert,
    })),
    upsert,
  };
}

const { createServiceRoleClientMock } = vi.hoisted(() => ({
  createServiceRoleClientMock: vi.fn(),
}));

async function loadRoute(
  sessionClient: SessionClient,
  serviceClient?: ReturnType<typeof settingsClient>,
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

function patchRequest(body: unknown) {
  return new Request("http://localhost/api/admin/registration", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/admin/registration", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unmock("@/lib/supabase/server");
    vi.unmock("@/lib/supabase/serviceRole");
  });

  it("retorna 401 sem sessão", async () => {
    const session: SessionClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error("no session"),
        }),
      },
      from: vi.fn(),
    };
    const route = await loadRoute(session);
    const response = await route.PATCH(patchRequest({ mode: "open" }));

    expect(response.status).toBe(401);
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
    const response = await route.PATCH(patchRequest({ mode: "open" }));

    expect(response.status).toBe(403);
  });

  it("retorna 400 para modo inválido", async () => {
    const session: SessionClient = {
      auth: authLogged("admin-1"),
      from: vi.fn((table: string) => {
        if (table === "users") return usersTier("admin");
        throw new Error(table);
      }),
    };
    const route = await loadRoute(session, settingsClient({ data: { mode: "open" } }));
    const response = await route.PATCH(patchRequest({ mode: "public" }));

    expect(response.status).toBe(400);
  });

  it("abre as inscrições para admin", async () => {
    const session: SessionClient = {
      auth: authLogged("admin-1"),
      from: vi.fn((table: string) => {
        if (table === "users") return usersTier("admin");
        throw new Error(table);
      }),
    };
    const service = settingsClient({ data: { mode: "open" } });
    const route = await loadRoute(session, service);
    const response = await route.PATCH(patchRequest({ mode: "open" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ mode: "open" });
    expect(service.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "default",
        mode: "open",
        updated_by: "admin-1",
      }),
      { onConflict: "id" },
    );
  });

  it("retorna 500 quando a gravação falha", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const session: SessionClient = {
      auth: authLogged("admin-1"),
      from: vi.fn((table: string) => {
        if (table === "users") return usersTier("admin");
        throw new Error(table);
      }),
    };
    const route = await loadRoute(
      session,
      settingsClient({
        data: null,
        error: { message: "write failed" },
      }),
    );
    const response = await route.PATCH(patchRequest({ mode: "invite" }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Não foi possível alterar o modo de inscrição.",
    });
    consoleErrorSpy.mockRestore();
  });
});
