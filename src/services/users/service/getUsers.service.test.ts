import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getUsers } from "./getUsers.service";

describe("getUsers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("deve retornar a lista de usuários quando a requisição for bem-sucedida", async () => {
    const users = [
      { id: "1", display_name: "Ana" },
      { id: "2", display_name: "João" },
    ];

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(users),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await getUsers();

    expect(fetchMock).toHaveBeenCalledWith("/api/users", {
      next: { tags: ["users"] },
    });
    expect(result).toEqual(users);
  });

  it("deve lançar erro quando a requisição falhar", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn(),
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(getUsers()).rejects.toThrow("Failed to fetch users");
  });
});
