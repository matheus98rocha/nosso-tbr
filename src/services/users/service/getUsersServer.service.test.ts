import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import { getUsersServer } from "./getUsersServer.service";

describe("getUsersServer — RN67 rede (eu + seguidos)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna [] sem sessão", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
      from: vi.fn(),
    });

    await expect(getUsersServer()).resolves.toEqual([]);
  });

  it("consulta user_followers e users.in com rede [eu, ...seguidos]", async () => {
    const followersEq = vi.fn().mockResolvedValue({
      data: [{ following_id: "peer" }],
      error: null,
    });
    const followersSelect = vi.fn(() => ({ eq: followersEq }));

    const usersOrder = vi.fn().mockResolvedValue({
      data: [
        { id: "me", display_name: "Eu" },
        { id: "peer", display_name: "Peer" },
      ],
      error: null,
    });
    const usersIn = vi.fn(() => ({ order: usersOrder }));
    const usersSelect = vi.fn(() => ({ in: usersIn }));

    const from = vi.fn((table: string) => {
      if (table === "user_followers") return { select: followersSelect };
      if (table === "users") return { select: usersSelect };
      throw new Error(`unexpected table: ${table}`);
    });

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "me" } },
          error: null,
        }),
      },
      from,
    });

    const result = await getUsersServer();

    expect(from).toHaveBeenCalledWith("user_followers");
    expect(followersSelect).toHaveBeenCalledWith("following_id");
    expect(followersEq).toHaveBeenCalledWith("follower_id", "me");
    expect(usersSelect).toHaveBeenCalledWith("id, display_name");
    expect(usersIn).toHaveBeenCalledWith("id", ["me", "peer"]);
    expect(result).toEqual([
      { id: "me", display_name: "Eu" },
      { id: "peer", display_name: "Peer" },
    ]);
  });

  it("sem follows usa só o próprio id na rede", async () => {
    const followersEq = vi.fn().mockResolvedValue({ data: [], error: null });
    const usersIn = vi.fn(() => ({
      order: vi.fn().mockResolvedValue({
        data: [{ id: "me", display_name: "Eu" }],
        error: null,
      }),
    }));

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "me" } },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "user_followers") {
          return { select: vi.fn(() => ({ eq: followersEq })) };
        }
        return {
          select: vi.fn(() => ({ in: usersIn })),
        };
      }),
    });

    await getUsersServer();

    expect(usersIn).toHaveBeenCalledWith("id", ["me"]);
  });
});
