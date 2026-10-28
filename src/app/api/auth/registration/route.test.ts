import { afterEach, describe, expect, it, vi } from "vitest";

const { createServiceRoleClientMock } = vi.hoisted(() => ({
  createServiceRoleClientMock: vi.fn(),
}));

function settingsClient(result: {
  data: { mode: string } | null;
  error?: { message: string } | null;
}) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: result.data,
    error: result.error ?? null,
  });

  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle })),
      })),
    })),
  };
}

async function loadRoute(serviceClient?: ReturnType<typeof settingsClient>) {
  vi.resetModules();
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

describe("GET /api/auth/registration", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unmock("@/lib/supabase/serviceRole");
  });

  it("retorna 503 quando o service role não está configurado", async () => {
    const route = await loadRoute();
    const response = await route.GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("SUPABASE_SERVICE_ROLE_KEY"),
    });
  });

  it("devolve invite quando a linha ainda não existe", async () => {
    const route = await loadRoute(settingsClient({ data: null }));
    const response = await route.GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ mode: "invite" });
  });

  it("devolve inscrições abertas", async () => {
    const route = await loadRoute(settingsClient({ data: { mode: "open" } }));
    const response = await route.GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ mode: "open" });
  });

  it("retorna 500 quando a leitura falha", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const route = await loadRoute(
      settingsClient({
        data: null,
        error: { message: "boom" },
      }),
    );
    const response = await route.GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Não foi possível verificar o modo de inscrição.",
    });
    consoleErrorSpy.mockRestore();
  });
});
