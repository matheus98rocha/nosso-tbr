import { beforeEach, describe, expect, it, vi } from "vitest";

import { OnboardingService } from "./onboarding.service";

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({})),
}));

const { getFollowingIds } = vi.hoisted(() => ({
  getFollowingIds: vi.fn(),
}));

vi.mock("@/services/userSocial/userSocial.service", () => ({
  UserSocialService: vi.fn(function UserSocialServiceMock(this: {
    getFollowingIds: typeof getFollowingIds;
  }) {
    this.getFollowingIds = getFollowingIds;
  }),
}));

type QueryResult<T> = { data: T; error: unknown };

type ThenableQuery<T> = {
  select: (columns?: string) => ThenableQuery<T>;
  order: (column?: string, options?: { ascending: boolean }) => ThenableQuery<T>;
  update: (values: Record<string, unknown>) => ThenableQuery<T>;
  eq: (column?: string, value?: string) => ThenableQuery<T>;
  is: (column?: string, value?: null) => ThenableQuery<T>;
  then: (resolve: (value: QueryResult<T>) => unknown) => Promise<unknown>;
};

function makeThenableQuery<T>(result: QueryResult<T>): ThenableQuery<T> {
  const query = {} as ThenableQuery<T>;
  query.select = vi.fn(() => query);
  query.order = vi.fn(() => query);
  query.update = vi.fn(() => query);
  query.eq = vi.fn(() => query);
  query.is = vi.fn(() => query);
  query.then = (resolve) => Promise.resolve(result).then(resolve);
  return query;
}

describe("OnboardingService.markWelcomeTutorialSeen", () => {
  it("atualiza welcome_tutorial_seen_at só quando ainda é null", async () => {
    const usersQuery = makeThenableQuery({ data: null, error: null });
    const from = vi.fn((table: string) => {
      if (table === "users") return usersQuery;
      throw new Error(`unexpected table ${table}`);
    });

    const service = new OnboardingService({ from } as never);
    const seenAt = await service.markWelcomeTutorialSeen("me");

    expect(from).toHaveBeenCalledWith("users");
    expect(usersQuery.update).toHaveBeenCalledWith({
      welcome_tutorial_seen_at: seenAt,
    });
    expect(usersQuery.eq).toHaveBeenCalledWith("id", "me");
    expect(usersQuery.is).toHaveBeenCalledWith(
      "welcome_tutorial_seen_at",
      null,
    );
  });
});

describe("OnboardingService.getFollowRecommendations", () => {
  beforeEach(() => {
    getFollowingIds.mockReset();
    getFollowingIds.mockResolvedValue([]);
  });

  it("ranqueia por overlap e exclui self", async () => {
    const usersQuery = makeThenableQuery({
      data: [
        { id: "me", display_name: "Eu", avatar_seed: null },
        { id: "ana", display_name: "Ana", avatar_seed: "a" },
        { id: "bia", display_name: "Bia", avatar_seed: null },
      ],
      error: null,
    });

    const rpc = vi.fn(async (name: string) => {
      if (name === "get_community_reader_genres") {
        return {
          data: [
            {
              reader_id: "me",
              gender: "fantasy",
              finished_count: 3,
              registered_count: 3,
            },
            {
              reader_id: "ana",
              gender: "fantasy",
              finished_count: 2,
              registered_count: 2,
            },
            {
              reader_id: "bia",
              gender: "romance",
              finished_count: 9,
              registered_count: 9,
            },
          ],
          error: null,
        };
      }
      if (name === "get_community_reader_activity") {
        return {
          data: [
            {
              reader_id: "ana",
              registered_count: 2,
              finished_count: 2,
              currently_reading_title: null,
            },
            {
              reader_id: "bia",
              registered_count: 9,
              finished_count: 9,
              currently_reading_title: null,
            },
          ],
          error: null,
        };
      }
      throw new Error(`unexpected rpc ${name}`);
    });

    const service = new OnboardingService({
      from: vi.fn(() => usersQuery),
      rpc,
    } as never);

    const result = await service.getFollowRecommendations("me");

    expect(result[0]?.readerId).toBe("ana");
    expect(result[0]?.reason).toEqual({
      kind: "shared_genre",
      gender: "fantasy",
    });
    expect(result.map((item) => item.readerId)).not.toContain("me");
  });
});
