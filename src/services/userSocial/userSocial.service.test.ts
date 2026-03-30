import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserSocialService } from "./userSocial.service";

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({})),
}));

type QueryResult<T> = { data: T; error: unknown };

function makeThenableQuery<T>(result: QueryResult<T>) {
  const query: any = {
    select: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    or: vi.fn(() => query),
    eq: vi.fn(() => query),
    delete: vi.fn(() => query),
    insert: vi.fn(() => Promise.resolve({ error: null })),
    then: (resolve: (value: QueryResult<T>) => unknown) =>
      Promise.resolve(result).then(resolve),
  };

  return query;
}

describe("UserSocialService", () => {
  const getUser = vi.fn();
  const from = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    from.mockImplementation((table: string) => {
      if (table === "users") {
        return makeThenableQuery({
          data: [{ id: "2", display_name: "Ana", email: "ana@mail.com" }],
          error: null,
        });
      }

      if (table === "user_followers") {
        return makeThenableQuery({
          data: [{ following_id: "2" }],
          error: null,
        });
      }

      return makeThenableQuery({ data: [], error: null });
    });
  });

  function makeService() {
    const service = new UserSocialService();
    (service as any).supabase = {
      auth: { getUser },
      from,
    };
    return service;
  }

  it("escapa caracteres especiais e busca por nome/email", async () => {
    const service = makeService();
    const result = await service.searchUsers("_ana% ");

    expect(from).toHaveBeenCalledWith("users");
    const usersQuery = from.mock.results[0].value;
    expect(usersQuery.or).toHaveBeenCalledWith(
      "display_name.ilike.%\\_ana\\%%,email.ilike.%\\_ana\\%%",
    );
    expect(result[0]).toMatchObject({
      id: "2",
      displayName: "Ana",
      email: "ana@mail.com",
    });
  });

  it("retorna [] quando não há usuário autenticado ao listar following", async () => {
    getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const service = makeService();

    const result = await service.getFollowingIds();

    expect(result).toEqual([]);
  });

  it("bloqueia follow em si mesmo", async () => {
    const service = makeService();

    await expect(service.follow("user-1")).rejects.toThrow("Cannot follow yourself");
  });

  it("executa unfollow com follower_id + following_id", async () => {
    const service = makeService();
    await service.unfollow("2");

    const followersQuery = from.mock.results[0].value;
    expect(followersQuery.delete).toHaveBeenCalled();
    expect(followersQuery.eq).toHaveBeenNthCalledWith(1, "follower_id", "user-1");
    expect(followersQuery.eq).toHaveBeenNthCalledWith(2, "following_id", "2");
  });
});
