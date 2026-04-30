import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const validPayload = {
  email: "tester@example.com",
  password: "Password123",
  display_name: "Tester",
  invite: "test-invite-secret",
};

type SupabaseMock = {
  auth: { signUp: ReturnType<typeof vi.fn> };
  from: ReturnType<typeof vi.fn>;
};

async function loadRouteWithClient(client: SupabaseMock) {
  vi.resetModules();

  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue(client),
  }));

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
  });

  it("returns 503 when REGISTER_INVITE_SECRET is not configured", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("REGISTER_INVITE_SECRET", "");

    const route = await loadRouteWithClient({
      auth: { signUp: vi.fn() },
      from: vi.fn(),
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
    const route = await loadRouteWithClient({
      auth: { signUp: vi.fn() },
      from: vi.fn(),
    });

    const response = await route.POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ ...validPayload, invite: "wrong-token" }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(403);
  });

  it("returns a client-safe auth error message and logs provider details", async () => {
    const signUp = vi.fn().mockResolvedValue({
      data: { user: null },
      error: {
        code: "email_exists",
        message: "User already registered",
        status: 400,
      },
    });

    const route = await loadRouteWithClient({
      auth: { signUp },
      from: vi.fn(),
    });

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
      "Auth signUp failed during registration",
      expect.objectContaining({
        code: "email_exists",
        message: "User already registered",
      }),
    );
  });

  it("returns 400 when request body is not valid JSON", async () => {
    const route = await loadRouteWithClient({
      auth: { signUp: vi.fn() },
      from: vi.fn(),
    });

    const response = await route.POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: "{not-json",
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid JSON body",
    });
  });

  it("returns 400 with validation details when body fails schema", async () => {
    const route = await loadRouteWithClient({
      auth: { signUp: vi.fn() },
      from: vi.fn(),
    });

    const response = await route.POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          ...validPayload,
          email: "not-an-email",
        }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual(
      expect.objectContaining({
        error: "Invalid input",
        details: expect.objectContaining({
          fieldErrors: expect.any(Object),
        }),
      }),
    );
  });

  it("returns 400 when password shorter than minimum length (RN37)", async () => {
    const route = await loadRouteWithClient({
      auth: { signUp: vi.fn() },
      from: vi.fn(),
    });

    const response = await route.POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          ...validPayload,
          password: "short",
        }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid input");
    expect(body.details.fieldErrors.password).toBeDefined();
  });

  it("returns weak_password message when auth rejects password strength", async () => {
    const signUp = vi.fn().mockResolvedValue({
      data: { user: null },
      error: {
        code: "weak_password",
        message: "Password should be stronger",
        status: 422,
      },
    });

    const route = await loadRouteWithClient({
      auth: { signUp },
      from: vi.fn(),
    });

    const response = await route.POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify(validPayload),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "A senha informada não atende aos requisitos mínimos.",
    });
  });

  it("maps user_already_exists to the email conflict message", async () => {
    const signUp = vi.fn().mockResolvedValue({
      data: { user: null },
      error: {
        code: "user_already_exists",
        message: "already registered",
        status: 400,
      },
    });

    const route = await loadRouteWithClient({
      auth: { signUp },
      from: vi.fn(),
    });

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
  });

  it("returns generic message for unknown auth error codes", async () => {
    const signUp = vi.fn().mockResolvedValue({
      data: { user: null },
      error: {
        code: "rate_limited",
        message: "Slow down",
        status: 429,
      },
    });

    const route = await loadRouteWithClient({
      auth: { signUp },
      from: vi.fn(),
    });

    const response = await route.POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify(validPayload),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Não foi possível concluir o cadastro. Tente novamente.",
    });
  });

  it("returns 400 when signUp succeeds without a user record", async () => {
    const signUp = vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const route = await loadRouteWithClient({
      auth: { signUp },
      from: vi.fn(),
    });

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
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Auth signUp succeeded without returning a user",
      { email: validPayload.email },
    );
  });

  it("returns 201 when registration and profile upsert succeed", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockReturnValue({ upsert });

    const route = await loadRouteWithClient({
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: { user: { id: "new-user-id" } },
          error: null,
        }),
      },
      from,
    });

    const response = await route.POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify(validPayload),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(upsert).toHaveBeenCalledWith(
      {
        id: "new-user-id",
        display_name: validPayload.display_name,
        email: validPayload.email,
      },
      { onConflict: "id" },
    );
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

    const route = await loadRouteWithClient({
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
      from,
    });

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
    expect(from).toHaveBeenCalledWith("users");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Profile upsert failed after auth signUp",
      expect.objectContaining({
        userId: "user-123",
        code: "23505",
      }),
    );
  });
});
