import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import {
  getCurrentUser,
  getCurrentUserSession,
} from "./getCurrentUser.service";

describe("getCurrentUserSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna null sem sessão", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
      from: vi.fn(),
    });

    await expect(getCurrentUserSession()).resolves.toBeNull();
  });

  it("seleciona tier em users e devolve sessão", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { tier: "admin" },
      error: null,
    });
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "bd12cc9a-51ec-452d-8722-a97547b6e0c0" } },
        }),
      },
      from,
    });

    const session = await getCurrentUserSession();

    expect(from).toHaveBeenCalledWith("users");
    expect(select).toHaveBeenCalledWith("tier");
    expect(eq).toHaveBeenCalledWith(
      "id",
      "bd12cc9a-51ec-452d-8722-a97547b6e0c0",
    );
    expect(session).toEqual({
      user: { id: "bd12cc9a-51ec-452d-8722-a97547b6e0c0" },
      tier: "admin",
    });
  });

  it("retorna tier null quando perfil não tem linha", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "u1" } },
        }),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      })),
    });

    const session = await getCurrentUserSession();
    expect(session).toEqual({
      user: { id: "u1" },
      tier: null,
    });
  });
});

describe("getCurrentUser", () => {
  it("retorna o user do auth", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "u1" } },
        }),
      },
    });

    await expect(getCurrentUser()).resolves.toEqual({ id: "u1" });
  });
});
