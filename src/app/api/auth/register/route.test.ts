import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const validPayload = {
  email: "tester@example.com",
  password: "Password123",
  display_name: "Tester",
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
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {
      // noop for tests
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
