import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const validPayload = {
  email: "tester@example.com",
  password: "Password123",
  display_name: "Tester",
  invite: "test-invite-secret",
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
    vi.stubEnv("REGISTER_INVITE_SECRET", "test-invite-secret");
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {
      // noop for tests
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
    vi.unmock("@/lib/supabase/server");
    vi.unmock("@/lib/supabase/serviceRole");
  });

  it("returns 503 when REGISTER_INVITE_SECRET is not configured", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("REGISTER_INVITE_SECRET", "");

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
  });

  it("returns 403 when invite token does not match", async () => {
    const route = await loadRoute(
      { auth: { signInWithPassword: vi.fn() } },
      {
        auth: { admin: { createUser: vi.fn() } },
        from: vi.fn(),
      },
    );

    const response = await route.POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ ...validPayload, invite: "wrong-token" }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(403);
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

    const route = await loadRoute(
      { auth: { signInWithPassword: vi.fn() } },
      {
        auth: { admin: { createUser } },
        from: vi.fn(),
      },
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

    const route = await loadRoute(
      { auth: { signInWithPassword: vi.fn() } },
      {
        auth: { admin: { createUser } },
        from: vi.fn(),
      },
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

  it("returns 201, cria perfil e autentica a sessão", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockReturnValue({ upsert });
    const createUser = vi.fn().mockResolvedValue({
      data: { user: { id: "new-user-id" } },
      error: null,
    });
    const signInWithPassword = vi.fn().mockResolvedValue({ error: null });

    const route = await loadRoute(
      { auth: { signInWithPassword } },
      {
        auth: { admin: { createUser } },
        from,
      },
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
    const from = vi.fn().mockReturnValue({ upsert });
    const createUser = vi.fn().mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    const signInWithPassword = vi.fn();

    const route = await loadRoute(
      { auth: { signInWithPassword } },
      {
        auth: { admin: { createUser } },
        from,
      },
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
    const from = vi.fn().mockReturnValue({ upsert });
    const createUser = vi.fn().mockResolvedValue({
      data: { user: { id: "new-user-id" } },
      error: null,
    });
    const signInWithPassword = vi.fn().mockResolvedValue({
      error: { code: "invalid_credentials", message: "Invalid login" },
    });

    const route = await loadRoute(
      { auth: { signInWithPassword } },
      {
        auth: { admin: { createUser } },
        from,
      },
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
