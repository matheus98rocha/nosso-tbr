import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserSocialService } from "./userSocial.service";

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({})),
}));

type QueryResult<T> = { data: T; error: unknown };

type ThenableQuery<T> = {
  select: () => ThenableQuery<T>;
  order: () => ThenableQuery<T>;
  limit: () => ThenableQuery<T>;
  or: () => ThenableQuery<T>;
  eq: () => ThenableQuery<T>;
  delete: () => ThenableQuery<T>;
  insert: () => Promise<{ error: null }>;
  then: (resolve: (value: QueryResult<T>) => unknown) => Promise<unknown>;
};

function makeThenableQuery<T>(result: QueryResult<T>): ThenableQuery<T> {
  const query = {} as ThenableQuery<T>;

  query.select = vi.fn(() => query);
  query.order = vi.fn(() => query);
  query.limit = vi.fn(() => query);
  query.or = vi.fn(() => query);
  query.eq = vi.fn(() => query);
  query.delete = vi.fn(() => query);
  query.insert = vi.fn(() => Promise.resolve({ error: null }));
  query.then = (resolve) => Promise.resolve(result).then(resolve);

  return query;
}

type TestSupabase = {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null }; error: unknown }>;
  };
  from: (table: string) => ThenableQuery<unknown>;
};

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
    (service as unknown as { supabase: TestSupabase }).supabase = {
      auth: { getUser },
      from,
    };
    return service;
  }

  it("escapa caracteres especiais e busca por nome/email", async () => {
    const service = makeService();
    const result = await service.searchUsers("_ana% ");

    expect(from).toHaveBeenCalledWith("users");
    const usersQuery = from.mock.results[0].value as ThenableQuery<unknown>;
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

  it("com followerId explícito não chama auth.getUser e filtra por follower_id", async () => {
    const service = makeService();

    const result = await service.getFollowingIds("user-explicit");

    expect(getUser).not.toHaveBeenCalled();
    expect(from).toHaveBeenCalledWith("user_followers");
    const followersQuery = from.mock.results.at(-1)
      ?.value as ThenableQuery<unknown>;
    expect(followersQuery.eq).toHaveBeenCalledWith(
      "follower_id",
      "user-explicit",
    );
    expect(result).toEqual(["2"]);
  });

  it("bloqueia follow em si mesmo", async () => {
    const service = makeService();

    await expect(service.follow("user-1")).rejects.toThrow("Cannot follow yourself");
  });

  it("executa unfollow com follower_id + following_id", async () => {
    const service = makeService();
    await service.unfollow("2");

    const followersQuery = from.mock.results[0].value as ThenableQuery<unknown>;
    expect(followersQuery.delete).toHaveBeenCalled();
    expect(followersQuery.eq).toHaveBeenNthCalledWith(1, "follower_id", "user-1");
    expect(followersQuery.eq).toHaveBeenNthCalledWith(2, "following_id", "2");
  });
});
