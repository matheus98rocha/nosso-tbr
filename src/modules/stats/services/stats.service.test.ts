import { beforeEach, describe, expect, it, vi } from "vitest";

import { StatsService } from "./stats.service";

type FollowersTable = "following" | "followers";

function createSupabaseMock(opts: {
  userId: string | null;
  followingIds?: string[];
  followerIds?: string[];
  leaderboardRows?: Array<{
    reader_id: string;
    display_name: string;
    books_read: number;
    total_pages: number;
  }>;
}) {
  const rpc = vi.fn().mockResolvedValue({
    data: opts.leaderboardRows ?? [],
    error: null,
  });

  const from = vi.fn((table: string) => {
    if (table !== "user_followers") {
      throw new Error(`unexpected table ${table}`);
    }

    let mode: FollowersTable = "following";

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn((column: string) => {
        if (column === "follower_id") mode = "following";
        if (column === "following_id") mode = "followers";
        return Promise.resolve({
          data:
            mode === "following"
              ? (opts.followingIds ?? []).map((id) => ({ following_id: id }))
              : (opts.followerIds ?? []).map((id) => ({ follower_id: id })),
          error: null,
        });
      }),
    };

    return chain;
  });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: opts.userId ? { id: opts.userId } : null },
      }),
    },
    from,
    rpc,
  };
}

describe("StatsService.getReadingLeaderboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty when viewer has no mutual follows", async () => {
    const supabase = createSupabaseMock({
      userId: "me",
      followingIds: ["a"],
      followerIds: ["b"],
      leaderboardRows: [
        {
          reader_id: "me",
          display_name: "Me",
          books_read: 3,
          total_pages: 100,
        },
        {
          reader_id: "a",
          display_name: "A",
          books_read: 5,
          total_pages: 200,
        },
      ],
    });

    const service = new StatsService(supabase as never);
    const result = await service.getReadingLeaderboard();

    expect(result).toEqual([]);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("keeps only self and mutual peers from RPC rows", async () => {
    const supabase = createSupabaseMock({
      userId: "me",
      followingIds: ["peer", "one-way"],
      followerIds: ["peer", "other"],
      leaderboardRows: [
        {
          reader_id: "stranger",
          display_name: "Stranger",
          books_read: 99,
          total_pages: 999,
        },
        {
          reader_id: "peer",
          display_name: "Peer",
          books_read: 4,
          total_pages: 400,
        },
        {
          reader_id: "me",
          display_name: "Me",
          books_read: 2,
          total_pages: 200,
        },
      ],
    });

    const service = new StatsService(supabase as never);
    const result = await service.getReadingLeaderboard(2024);

    expect(supabase.rpc).toHaveBeenCalledWith("get_reading_leaderboard", {
      year_input: 2024,
    });
    expect(result.map((row) => row.readerId)).toEqual(["peer", "me"]);
  });

  it("returns empty when there is no authenticated user", async () => {
    const supabase = createSupabaseMock({ userId: null });
    const service = new StatsService(supabase as never);

    await expect(service.getReadingLeaderboard()).resolves.toEqual([]);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
});
