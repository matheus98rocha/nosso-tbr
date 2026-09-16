import { beforeEach, describe, expect, it, vi } from "vitest";

import { CommunityService } from "./community.service";

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({})),
}));

const { getFollowingIds, getFollowerIds } = vi.hoisted(() => ({
  getFollowingIds: vi.fn(),
  getFollowerIds: vi.fn(),
}));

vi.mock("@/services/userSocial/userSocial.service", () => ({
  UserSocialService: vi.fn(function UserSocialServiceMock(this: {
    getFollowingIds: typeof getFollowingIds;
    getFollowerIds: typeof getFollowerIds;
  }) {
    this.getFollowingIds = getFollowingIds;
    this.getFollowerIds = getFollowerIds;
  }),
}));

type QueryResult<T> = { data: T; error: unknown };

type ThenableQuery<T> = {
  select: (columns?: string) => ThenableQuery<T>;
  order: (column?: string, options?: { ascending: boolean }) => ThenableQuery<T>;
  then: (resolve: (value: QueryResult<T>) => unknown) => Promise<unknown>;
};

function makeThenableQuery<T>(result: QueryResult<T>): ThenableQuery<T> {
  const query = {} as ThenableQuery<T>;

  query.select = vi.fn(() => query);
  query.order = vi.fn(() => query);
  query.then = (resolve) => Promise.resolve(result).then(resolve);

  return query;
}

type UserRow = {
  id: string;
  display_name: string | null;
  avatar_seed: string | null;
  email?: string;
};

type GenreRpcRow = {
  reader_id: string;
  gender: string;
  finished_count: number;
  registered_count: number;
};

type ActivityRpcRow = {
  reader_id: string;
  registered_count: number;
  finished_count: number;
  currently_reading_title: string | null;
};

const SELF_ID = "self-1";
const UUID_NAME = "11111111-1111-4111-8111-111111111111";

const genreRows: GenreRpcRow[] = [
  {
    reader_id: "ana",
    gender: "fiction",
    finished_count: 3,
    registered_count: 5,
  },
  {
    reader_id: "ana",
    gender: "fantasy",
    finished_count: 3,
    registered_count: 3,
  },
  {
    reader_id: SELF_ID,
    gender: "romance",
    finished_count: 9,
    registered_count: 9,
  },
];

const activityRows: ActivityRpcRow[] = [
  {
    reader_id: "ana",
    registered_count: 8,
    finished_count: 5,
    currently_reading_title: "O Nome do Vento",
  },
  {
    reader_id: SELF_ID,
    registered_count: 9,
    finished_count: 9,
    currently_reading_title: null,
  },
];

describe("CommunityService.getSnapshot", () => {
  const from = vi.fn();
  const rpc = vi.fn();
  let usersQuery: ThenableQuery<UserRow[]>;

  beforeEach(() => {
    vi.clearAllMocks();

    usersQuery = makeThenableQuery({
      data: [
        {
          id: SELF_ID,
          display_name: "Eu",
          avatar_seed: "me-seed",
          email: "me@mail.com",
        },
        {
          id: "ana",
          display_name: "Ana",
          avatar_seed: "ana-seed",
          email: "ana@mail.com",
        },
        {
          id: "bruno",
          display_name: "Bruno",
          avatar_seed: null,
        },
        {
          id: "vazio",
          display_name: "   ",
          avatar_seed: null,
        },
        {
          id: "uuid-user",
          display_name: UUID_NAME,
          avatar_seed: null,
        },
      ],
      error: null,
    });

    from.mockImplementation((table: string) => {
      if (table === "users") {
        return usersQuery;
      }

      throw new Error(`tabela inesperada ${table}`);
    });

    rpc.mockImplementation((name: string) => {
      if (name === "get_community_reader_genres") {
        return Promise.resolve({ data: genreRows, error: null });
      }

      if (name === "get_community_reader_activity") {
        return Promise.resolve({ data: activityRows, error: null });
      }

      throw new Error(`rpc inesperada ${name}`);
    });

    getFollowingIds.mockResolvedValue(["ana"]);
    getFollowerIds.mockResolvedValue(["bruno"]);
  });

  function makeService() {
    return new CommunityService(
      { from, rpc } as never,
      {
        getFollowingIds,
        getFollowerIds,
      } as never,
    );
  }

  it("seleciona id, display_name e avatar_seed sem e-mail", async () => {
    const service = makeService();
    await service.getSnapshot(SELF_ID);

    expect(from).toHaveBeenCalledWith("users");
    expect(usersQuery.select).toHaveBeenCalledWith("id, display_name, avatar_seed");
    expect(usersQuery.select).not.toHaveBeenCalledWith(
      expect.stringContaining("email"),
    );
    expect(rpc).toHaveBeenCalledWith("get_community_reader_genres");
    expect(rpc).toHaveBeenCalledWith("get_community_reader_activity");
  });

  it("exclui o próprio usuário da lista de membros", async () => {
    const service = makeService();
    const snapshot = await service.getSnapshot(SELF_ID);

    expect(snapshot.members.some((member) => member.id === SELF_ID)).toBe(false);
    expect(snapshot.members.map((member) => member.id)).toEqual([
      "ana",
      "bruno",
      "vazio",
      "uuid-user",
    ]);
  });

  it("usa Leitor no lugar de nome vazio ou UUID", async () => {
    const service = makeService();
    const snapshot = await service.getSnapshot(SELF_ID);

    const emptyName = snapshot.members.find((member) => member.id === "vazio");
    const uuidName = snapshot.members.find((member) => member.id === "uuid-user");

    expect(emptyName?.displayName).toBe("Leitor");
    expect(uuidName?.displayName).toBe("Leitor");
    expect(snapshot.members.some((member) => member.displayName === UUID_NAME)).toBe(
      false,
    );
    expect(JSON.stringify(snapshot)).not.toContain("@mail.com");
  });

  it("marca isFollowing e isFollower só pelos IDs da rede", async () => {
    const service = makeService();
    const snapshot = await service.getSnapshot(SELF_ID);

    expect(snapshot.followingIds).toEqual(["ana"]);
    expect(snapshot.followerIds).toEqual(["bruno"]);

    const byId = Object.fromEntries(
      snapshot.members.map((member) => [member.id, member]),
    );

    expect(byId.ana.isFollowing).toBe(true);
    expect(byId.ana.isFollower).toBe(false);
    expect(byId.bruno.isFollowing).toBe(false);
    expect(byId.bruno.isFollower).toBe(true);
    expect(byId.vazio.isFollowing).toBe(false);
    expect(byId.vazio.isFollower).toBe(false);
  });

  it("mapeia gêneros da RPC via pickTopGenre (lido = finished, cadastrado = registered)", async () => {
    const service = makeService();
    const snapshot = await service.getSnapshot(SELF_ID);

    const ana = snapshot.members.find((member) => member.id === "ana");
    const bruno = snapshot.members.find((member) => member.id === "bruno");

    expect(ana?.mostReadGender).toBe("fantasy");
    expect(ana?.mostRegisteredGender).toBe("fiction");
    expect(bruno?.mostReadGender).toBeNull();
    expect(bruno?.mostRegisteredGender).toBeNull();
  });

  describe("RN-COM-13", () => {
    it("mapeia cadastrados, lidos e o livro em leitura da RPC de atividade", async () => {
      const service = makeService();
      const snapshot = await service.getSnapshot(SELF_ID);

      const ana = snapshot.members.find((member) => member.id === "ana");
      const bruno = snapshot.members.find((member) => member.id === "bruno");

      expect(ana?.registeredCount).toBe(8);
      expect(ana?.finishedCount).toBe(5);
      expect(ana?.currentlyReadingTitle).toBe("O Nome do Vento");
      expect(bruno?.registeredCount).toBe(0);
      expect(bruno?.finishedCount).toBe(0);
      expect(bruno?.currentlyReadingTitle).toBeNull();
      expect(snapshot.members.some((member) => member.id === SELF_ID)).toBe(
        false,
      );
    });

    it("lança RepositoryError quando a RPC de atividade falha", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      rpc.mockImplementation((name: string) => {
        if (name === "get_community_reader_genres") {
          return Promise.resolve({ data: [], error: null });
        }

        if (name === "get_community_reader_activity") {
          return Promise.resolve({
            data: null,
            error: { message: "rpc failed" },
          });
        }

        throw new Error(`rpc inesperada ${name}`);
      });

      const service = makeService();

      await expect(service.getSnapshot(SELF_ID)).rejects.toMatchObject({
        name: "RepositoryError",
        message: "Failed to load community activity",
      });

      consoleError.mockRestore();
    });
  });
});
