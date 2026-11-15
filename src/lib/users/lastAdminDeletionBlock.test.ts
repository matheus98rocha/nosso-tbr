import { describe, expect, it, vi } from "vitest";

import { lastAdminDeletionBlock } from "./lastAdminDeletionBlock";

function client(result: {
  count: number | null;
  error: { message: string } | null;
}) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue(result),
      })),
    })),
  };
}

describe("lastAdminDeletionBlock", () => {
  it("libera quem não é admin sem consultar a contagem", async () => {
    const db = client({ count: 1, error: null });

    await expect(lastAdminDeletionBlock(db, "common_user")).resolves.toBeNull();
    await expect(lastAdminDeletionBlock(db, null)).resolves.toBeNull();
    await expect(lastAdminDeletionBlock(db, undefined)).resolves.toBeNull();
    expect(db.from).not.toHaveBeenCalled();
  });

  it("bloqueia o último admin quando a contagem é 1, 0 ou nula", async () => {
    const blocked = {
      status: 409,
      error: "Não é possível excluir o último admin.",
    };

    await expect(
      lastAdminDeletionBlock(client({ count: 1, error: null }), "admin"),
    ).resolves.toEqual(blocked);
    await expect(
      lastAdminDeletionBlock(client({ count: 0, error: null }), "admin"),
    ).resolves.toEqual(blocked);
    await expect(
      lastAdminDeletionBlock(client({ count: null, error: null }), "admin"),
    ).resolves.toEqual(blocked);
  });

  it("libera quando existe outro admin", async () => {
    await expect(
      lastAdminDeletionBlock(client({ count: 2, error: null }), "admin"),
    ).resolves.toBeNull();
  });

  it("recusa a exclusão quando a contagem falha", async () => {
    await expect(
      lastAdminDeletionBlock(
        client({ count: 5, error: { message: "db down" } }),
        "admin",
      ),
    ).resolves.toEqual({ status: 500, error: "db down" });
  });
});
