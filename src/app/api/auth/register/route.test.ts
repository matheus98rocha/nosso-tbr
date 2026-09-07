import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const validPayload = {
  email: "tester@example.com",
  password: "Password123",
  display_name: "Tester",
  invite: "valid-invite-token",
};

type SessionClient = {
  auth: {
    signInWithPassword: ReturnType<typeof vi.fn>;
  };
};

type AdminClient = {
  auth: {
    admin: {
      createUser: ReturnType<typeof vi.fn>;
    };
  };
  from: ReturnType<typeof vi.fn>;
};

const { createServiceRoleClientMock } = vi.hoisted(() => ({
  createServiceRoleClientMock: vi.fn(),
}));

function mockRegisterInviteLookup(
  adminClient: AdminClient,
  result: {
    data: {
      id: string;
      token: string;
      expires_at: string;
    } | null;
    error?: null;
  },
) {
  const maybeSingle = vi.fn().mockResolvedValue({ ...result, error: result.error ?? null });
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));

  const originalFrom = adminClient.from as (table: string) => unknown;
  adminClient.from = vi.fn((table: string) => {
    if (table === "register_invites") return { select };
    return originalFrom(table);
  }) as AdminClient["from"];

  return { select, eq, maybeSingle };
}

async function loadRoute(sessionClient: SessionClient, adminClient?: AdminClient) {
  vi.resetModules();

  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue(sessionClient),
  }));

  vi.doMock("@/lib/supabase/serviceRole", () => ({
    createServiceRoleClient: createServiceRoleClientMock,
  }));

  if (adminClient) {
    createServiceRoleClientMock.mockReturnValue(adminClient);
  } else {
    createServiceRoleClientMock.mockImplementation(() => {
      throw new Error("missing key");
    });
  }

  return import("./route");
}

describe("POST /api/auth/register", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-07T12:00:00.000Z"));
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {
      // noop for tests
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.resetModules();
    vi.unmock("@/lib/supabase/server");
    vi.unmock("@/lib/supabase/serviceRole");
  });

  it("returns 403 when invite token is unknown in register_invites", async () => {
    const upsert = vi.fn();
    const adminClient: AdminClient = {
      auth: { admin: { createUser: vi.fn() } },
      from: vi.fn((table: string) => {
        if (table === "users") return { upsert };
        throw new Error(table);
      }),
    };

    mockRegisterInviteLookup(adminClient, { data: null });

    const route = await loadRoute({ auth: { signInWithPassword: vi.fn() } }, adminClient);

    const response = await route.POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify(validPayload),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("Convite inválido ou expirado"),
    });
  });

  it("returns 403 when invite exists but is expired", async () => {
    const upsert = vi.fn();
    const adminClient: AdminClient = {
      auth: { admin: { createUser: vi.fn() } },
      from: vi.fn((table: string) => {
        if (table === "users") return { upsert };
        throw new Error(table);
      }),
    };

    mockRegisterInviteLookup(adminClient, {
      data: {
        id: "invite-expired",
        token: validPayload.invite,
        expires_at: "2026-09-07T11:59:59.999Z",
      },
    });

    const route = await loadRoute({ auth: { signInWithPassword: vi.fn() } }, adminClient);

    const response = await route.POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify(validPayload),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("Convite inválido ou expirado"),
    });
  });

  it("returns 503 when service role is not configured", async () => {
    const route = await loadRoute({
      auth: { signInWithPassword: vi.fn() },
    });

    const response = await route.POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify(validPayload),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("SUPABASE_SERVICE_ROLE_KEY"),
    });
  });

  it("returns a client-safe auth error message and logs provider details", async () => {
    const createUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: {
        code: "email_exists",
        message: "User already registered",
        status: 422,
      },
    });
    const upsert = vi.fn();
    const adminClient: AdminClient = {
      auth: { admin: { createUser } },
      from: vi.fn((table: string) => {
        if (table === "users") return { upsert };
        throw new Error(table);
      }),
    };

    mockRegisterInviteLookup(adminClient, {
      data: {
        id: "invite-valid",
        token: validPayload.invite,
        expires_at: "2026-09-08T12:00:00.000Z",
      },
    });

    const route = await loadRoute(
      { auth: { signInWithPassword: vi.fn() } },
      adminClient,
    );

    const response = await route.POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify(validPayload),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Não foi possível concluir o cadastro com esse e-mail.",
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Auth createUser failed during registration",
      expect.objectContaining({ code: "email_exists" }),
    );
  });

  it("returns 400 when createUser succeeds without a user", async () => {
    const createUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    });
    const upsert = vi.fn();
    const adminClient: AdminClient = {
      auth: { admin: { createUser } },
      from: vi.fn((table: string) => {
        if (table === "users") return { upsert };
        throw new Error(table);
      }),
    };

    mockRegisterInviteLookup(adminClient, {
      data: {
        id: "invite-valid",
        token: validPayload.invite,
        expires_at: "2026-09-08T12:00:00.000Z",
      },
    });

    const route = await loadRoute(
      { auth: { signInWithPassword: vi.fn() } },
      adminClient,
    );

    const response = await route.POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify(validPayload),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Registration did not return a user",
    });
  });

  it("returns 201, cria perfil e autentica a sessão com convite válido no banco", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const createUser = vi.fn().mockResolvedValue({
      data: { user: { id: "new-user-id" } },
      error: null,
    });
    const signInWithPassword = vi.fn().mockResolvedValue({ error: null });

    const adminClient: AdminClient = {
      auth: { admin: { createUser } },
      from: vi.fn((table: string) => {
        if (table === "users") return { upsert };
        throw new Error(table);
      }),
    };

    const inviteLookup = mockRegisterInviteLookup(adminClient, {
      data: {
        id: "invite-valid",
        token: validPayload.invite,
        expires_at: "2026-09-08T12:00:00.000Z",
      },
    });

    const route = await loadRoute(
      { auth: { signInWithPassword } },
      adminClient,
    );

    const response = await route.POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify(validPayload),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(inviteLookup.eq).toHaveBeenCalledWith("token", validPayload.invite);
    expect(createUser).toHaveBeenCalledWith({
      email: validPayload.email,
      password: validPayload.password,
      email_confirm: true,
    });
    expect(upsert).toHaveBeenCalledWith(
      {
        id: "new-user-id",
        display_name: validPayload.display_name,
        email: validPayload.email,
        tier: "common_user",
      },
      { onConflict: "id" },
    );
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: validPayload.email,
      password: validPayload.password,
    });
  });

  it("returns a generic message when auth succeeds but profile upsert fails", async () => {
    const upsert = vi.fn().mockResolvedValue({
      error: {
        code: "23505",
        message: "duplicate key value violates unique constraint",
        details: "Key (id)=(...) already exists.",
        hint: null,
      },
    });
    const createUser = vi.fn().mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    const signInWithPassword = vi.fn();

    const adminClient: AdminClient = {
      auth: { admin: { createUser } },
      from: vi.fn((table: string) => {
        if (table === "users") return { upsert };
        throw new Error(table);
      }),
    };

    mockRegisterInviteLookup(adminClient, {
      data: {
        id: "invite-valid",
        token: validPayload.invite,
        expires_at: "2026-09-08T12:00:00.000Z",
      },
    });

    const route = await loadRoute(
      { auth: { signInWithPassword } },
      adminClient,
    );

    const response = await route.POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify(validPayload),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error:
        "Cadastro criado, mas não foi possível salvar seu perfil agora. Tente novamente em instantes.",
    });
    expect(signInWithPassword).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Profile upsert failed after auth createUser",
      expect.objectContaining({
        userId: "user-123",
        code: "23505",
      }),
    );
  });

  it("returns 500 when sign-in after registration fails", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const createUser = vi.fn().mockResolvedValue({
      data: { user: { id: "new-user-id" } },
      error: null,
    });
    const signInWithPassword = vi.fn().mockResolvedValue({
      error: { code: "invalid_credentials", message: "Invalid login" },
    });

    const adminClient: AdminClient = {
      auth: { admin: { createUser } },
      from: vi.fn((table: string) => {
        if (table === "users") return { upsert };
        throw new Error(table);
      }),
    };

    mockRegisterInviteLookup(adminClient, {
      data: {
        id: "invite-valid",
        token: validPayload.invite,
        expires_at: "2026-09-08T12:00:00.000Z",
      },
    });

    const route = await loadRoute(
      { auth: { signInWithPassword } },
      adminClient,
    );

    const response = await route.POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify(validPayload),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("Faça login"),
    });
  });
});
