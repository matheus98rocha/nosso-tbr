import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ensureAddedReadersAreFollowed,
  UNFOLLOWED_READER_ERROR,
} from "./ensureAddedReadersAreFollowed";

describe("ensureAddedReadersAreFollowed", () => {
  const inFollowers = vi.fn();
  const eq = vi.fn(() => ({ in: inFollowers }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn((table: string) => {
    if (table === "user_followers") return { select };
    return {};
  });

  beforeEach(() => {
    vi.clearAllMocks();
    inFollowers.mockResolvedValue({ data: [], error: null });
  });

  it("não consulta seguidores quando ninguém novo entra na leitura", async () => {
    const result = await ensureAddedReadersAreFollowed(
      { from } as never,
      "alice",
      ["alice", "bob"],
      ["alice", "bob"],
    );

    expect(result).toBeNull();
    expect(from).not.toHaveBeenCalled();
  });

  it("aceita quando cada leitor novo é seguido", async () => {
    inFollowers.mockResolvedValue({
      data: [{ following_id: "bob" }, { following_id: "carol" }],
      error: null,
    });

    const result = await ensureAddedReadersAreFollowed(
      { from } as never,
      "alice",
      ["alice"],
      ["alice", " bob ", "carol", "carol"],
    );

    expect(result).toBeNull();
    expect(from).toHaveBeenCalledWith("user_followers");
    expect(eq).toHaveBeenCalledWith("follower_id", "alice");
    expect(inFollowers).toHaveBeenCalledWith("following_id", ["bob", "carol"]);
  });

  it("recusa com 403 quando algum leitor novo não é seguido", async () => {
    inFollowers.mockResolvedValue({
      data: [{ following_id: "bob" }],
      error: null,
    });

    const result = await ensureAddedReadersAreFollowed(
      { from } as never,
      "alice",
      [],
      ["bob", "carol"],
    );

    expect(result).toEqual({
      error: UNFOLLOWED_READER_ERROR,
      status: 403,
    });
  });

  it("falha fechado com 500 quando a consulta de seguidores erra", async () => {
    inFollowers.mockResolvedValue({
      data: [{ following_id: "bob" }],
      error: { message: "timeout" },
    });

    const result = await ensureAddedReadersAreFollowed(
      { from } as never,
      "alice",
      null,
      ["bob"],
    );

    expect(result).toEqual({
      error: "Não foi possível confirmar quem você segue",
      status: 500,
    });
  });

  it("trata a lista de seguidores nula como ninguém seguido", async () => {
    inFollowers.mockResolvedValue({ data: null, error: null });

    const result = await ensureAddedReadersAreFollowed(
      { from } as never,
      "alice",
      undefined,
      ["bob"],
    );

    expect(result).toEqual({
      error: UNFOLLOWED_READER_ERROR,
      status: 403,
    });
  });
});
