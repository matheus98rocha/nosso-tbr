import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ensureAddedReadersAreFollowed,
  UNFOLLOWED_READER_ERROR,
} from "./ensureAddedReadersAreFollowed";

describe("ensureAddedReadersAreFollowed", () => {
  const inFollowers = vi.fn();
  const eqFollowers = vi.fn(() => ({ in: inFollowers }));
  const selectFollowers = vi.fn(() => ({ eq: eqFollowers }));
  const from = vi.fn((table: string) => {
    if (table === "user_followers") return { select: selectFollowers };
    return {};
  });
  const supabase = { from } as never;

  beforeEach(() => {
    vi.clearAllMocks();
    inFollowers.mockResolvedValue({ data: [], error: null });
  });

  it("não consulta seguidores quando ninguém novo entra no livro", async () => {
    const result = await ensureAddedReadersAreFollowed(
      supabase,
      "actor",
      ["actor", "bia"],
      ["actor", " bia ", ""],
    );

    expect(result).toBeNull();
    expect(from).not.toHaveBeenCalled();
  });

  it("falha fechado quando a consulta de seguidores quebra", async () => {
    inFollowers.mockResolvedValue({
      data: [{ following_id: "bia" }],
      error: { message: "rls" },
    });

    const result = await ensureAddedReadersAreFollowed(
      supabase,
      "actor",
      [],
      ["actor", "bia"],
    );

    expect(result).toEqual({
      error: "Não foi possível confirmar quem você segue",
      status: 500,
    });
    expect(eqFollowers).toHaveBeenCalledWith("follower_id", "actor");
    expect(inFollowers).toHaveBeenCalledWith("following_id", ["bia"]);
  });

  it("recusa quando só parte dos leitores novos é seguida", async () => {
    inFollowers.mockResolvedValue({
      data: [{ following_id: "bia" }, { following_id: "" }, { following_id: null }],
      error: null,
    });

    const result = await ensureAddedReadersAreFollowed(
      supabase,
      "actor",
      ["actor"],
      ["actor", "bia", "bia", "caio"],
    );

    expect(result).toEqual({
      error: UNFOLLOWED_READER_ERROR,
      status: 403,
    });
    expect(inFollowers).toHaveBeenCalledWith("following_id", ["bia", "caio"]);
  });

  it("trata resposta vazia como ninguém seguido", async () => {
    inFollowers.mockResolvedValue({ data: null, error: null });

    const result = await ensureAddedReadersAreFollowed(
      supabase,
      "actor",
      null,
      ["bia"],
    );

    expect(result).toEqual({
      error: UNFOLLOWED_READER_ERROR,
      status: 403,
    });
  });

  it("permite quando cada leitor novo está na lista de seguidos", async () => {
    inFollowers.mockResolvedValue({
      data: [{ following_id: "bia" }, { following_id: "caio" }],
      error: null,
    });

    const result = await ensureAddedReadersAreFollowed(
      supabase,
      "actor",
      undefined,
      ["bia", "caio"],
    );

    expect(result).toBeNull();
  });
});
