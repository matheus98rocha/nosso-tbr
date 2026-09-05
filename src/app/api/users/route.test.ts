import { afterEach, describe, expect, it, vi } from "vitest";

type Client = {
  auth: { getUser: ReturnType<typeof vi.fn> };
  from: ReturnType<typeof vi.fn>;
};

function authLogged(userId: string): Client["auth"] {
  return {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    }),
  };
}

function followersQuery(result: {
  data: { following_id: string }[] | null;
  error: { message: string } | null;
}) {
  const eq = vi.fn().mockResolvedValue(result);
  const select = vi.fn(() => ({ eq }));
  return { select, eq };
}

function usersNetworkQuery(result: {
  data: { id: string; display_name: string }[] | null;
  error: { message: string } | null;
}) {
  const order = vi.fn().mockResolvedValue(result);
  const inFn = vi.fn(() => ({ order }));
  const select = vi.fn(() => ({ in: inFn }));
  return { select, in: inFn, order };
}

function clientForNetwork(opts: {
  userId: string;
  followingIds: string[];
  usersRows?: { id: string; display_name: string }[];
  usersError?: { message: string } | null;
  followersError?: { message: string } | null;
}): {
  client: Client;
  followers: ReturnType<typeof followersQuery>;
  users: ReturnType<typeof usersNetworkQuery>;
} {
  const followers = followersQuery(
    opts.followersError
      ? { data: null, error: opts.followersError }
      : {
          data: opts.followingIds.map((following_id) => ({ following_id })),
          error: null,
        },
  );
  const users = usersNetworkQuery({
    data: opts.usersError ? null : (opts.usersRows ?? []),
    error: opts.usersError ?? null,
  });

  const client: Client = {
    auth: authLogged(opts.userId),
    from: vi.fn((table: string) => {
      if (table === "user_followers") return followers;
      if (table === "users") return users;
      throw new Error(`unexpected table: ${table}`);
    }),
  };

  return { client, followers, users };
}

async function loadRoute(client: Client) {
  vi.resetModules();
  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue(client),
  }));
  return import("./route");
}

describe("GET /api/users", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unmock("@/lib/supabase/server");
  });

  describe("RN18 / RN46 — lista autenticada da rede (eu + seguidos)", () => {
    it("retorna 401 quando não há usuário", async () => {
      const client: Client = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
        from: vi.fn(),
      };
      const route = await loadRoute(client);
      const res = await route.GET();
      expect(res.status).toBe(401);
      expect(client.from).not.toHaveBeenCalled();
    });

    it("após auth OK consulta user_followers com follower_id = auth.uid", async () => {
      const { client, followers, users } = clientForNetwork({
        userId: "me",
        followingIds: ["a"],
        usersRows: [
          { id: "me", display_name: "Eu" },
          { id: "a", display_name: "A" },
        ],
      });
      const route = await loadRoute(client);
      await route.GET();

      expect(client.from).toHaveBeenCalledWith("user_followers");
      expect(followers.select).toHaveBeenCalledWith("following_id");
      expect(followers.eq).toHaveBeenCalledWith("follower_id", "me");
      expect(users.select).toHaveBeenCalled();
    });

    it("seleciona users com .in(\"id\", [eu, ...following_ids])", async () => {
      const { client, users } = clientForNetwork({
        userId: "me",
        followingIds: ["peer-1", "peer-2"],
        usersRows: [
          { id: "me", display_name: "Eu" },
          { id: "peer-1", display_name: "P1" },
          { id: "peer-2", display_name: "P2" },
        ],
      });
      const route = await loadRoute(client);
      const res = await route.GET();

      expect(res.status).toBe(200);
      expect(client.from).toHaveBeenCalledWith("users");
      expect(users.select).toHaveBeenCalledWith("id, display_name");
      expect(users.in).toHaveBeenCalledWith("id", ["me", "peer-1", "peer-2"]);
    });

    it("retorna só a rede (eu + seguidos), não o universo inteiro", async () => {
      const networkRows = [
        { id: "me", display_name: "Eu" },
        { id: "friend", display_name: "Amigo" },
      ];
      const { client, users } = clientForNetwork({
        userId: "me",
        followingIds: ["friend"],
        usersRows: networkRows,
      });
      const route = await loadRoute(client);
      const res = await route.GET();

      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual(networkRows);
      expect(users.in).toHaveBeenCalledWith("id", ["me", "friend"]);
      expect(res.headers.get("Cache-Control")).toBe("no-store");
      expect(res.headers.get("x-nextjs-cache-tags")).toBe("users");
    });

    it("sem follows retorna só o próprio usuário", async () => {
      const onlyMe = [{ id: "me", display_name: "Eu" }];
      const { client, users } = clientForNetwork({
        userId: "me",
        followingIds: [],
        usersRows: onlyMe,
      });
      const route = await loadRoute(client);
      const res = await route.GET();

      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual(onlyMe);
      expect(users.in).toHaveBeenCalledWith("id", ["me"]);
    });

    it("retorna 500 quando user_followers falha", async () => {
      const { client, users } = clientForNetwork({
        userId: "me",
        followingIds: [],
        followersError: { message: "followers down" },
      });
      const route = await loadRoute(client);
      const res = await route.GET();

      expect(res.status).toBe(500);
      await expect(res.json()).resolves.toEqual({ error: "followers down" });
      expect(client.from).toHaveBeenCalledWith("user_followers");
      expect(client.from).not.toHaveBeenCalledWith("users");
      expect(users.select).not.toHaveBeenCalled();
    });

    it("retorna 500 quando select de users falha", async () => {
      const { client } = clientForNetwork({
        userId: "me",
        followingIds: ["a"],
        usersError: { message: "db" },
      });
      const route = await loadRoute(client);
      const res = await route.GET();

      expect(res.status).toBe(500);
      await expect(res.json()).resolves.toEqual({ error: "db" });
    });
  });
});
