import { beforeEach, describe, expect, it, vi } from "vitest";

import { PopularReadersService } from "./popularReaders.service";

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({})),
}));

describe("PopularReadersService", () => {
  const rpc = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps and sorts rpc rows by score", async () => {
    rpc.mockResolvedValue({
      data: [
        {
          reader_id: "low",
          display_name: "Low",
          avatar_seed: null,
          follower_count: 1,
          shared_gender_count: 0,
          shared_author_count: 0,
          score: 1,
        },
        {
          reader_id: "high",
          display_name: "High",
          avatar_seed: "s",
          follower_count: 2,
          shared_gender_count: 1,
          shared_author_count: 1,
          score: 9,
        },
      ],
      error: null,
    });

    const service = new PopularReadersService({
      rpc,
    } as never);

    const readers = await service.list(12);

    expect(rpc).toHaveBeenCalledWith("get_popular_readers_for_home", {
      p_limit: 12,
    });
    expect(readers.map((reader) => reader.id)).toEqual(["high", "low"]);
    expect(readers[0]?.displayName).toBe("High");
  });

  it("clamps limit between 1 and 24", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    const service = new PopularReadersService({ rpc } as never);

    await service.list(0);
    expect(rpc).toHaveBeenLastCalledWith("get_popular_readers_for_home", {
      p_limit: 1,
    });

    await service.list(100);
    expect(rpc).toHaveBeenLastCalledWith("get_popular_readers_for_home", {
      p_limit: 24,
    });
  });

  it("throws when rpc fails", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: "boom" },
    });
    const service = new PopularReadersService({ rpc } as never);

    await expect(service.list()).rejects.toBeTruthy();
  });
});
