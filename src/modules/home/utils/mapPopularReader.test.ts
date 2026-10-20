import { describe, expect, it } from "vitest";

import type { PopularReader } from "../types";
import {
  comparePopularReaders,
  excludeFollowedReaders,
  mapPopularReaderRow,
} from "./mapPopularReader";

function reader(partial: Partial<PopularReader> & { id: string }): PopularReader {
  return {
    displayName: partial.displayName ?? partial.id,
    avatarSeed: partial.avatarSeed ?? null,
    followerCount: partial.followerCount ?? 0,
    sharedGenderCount: partial.sharedGenderCount ?? 0,
    sharedAuthorCount: partial.sharedAuthorCount ?? 0,
    score: partial.score ?? 0,
    isFollowing: partial.isFollowing ?? false,
    id: partial.id,
  };
}

describe("mapPopularReaderRow", () => {
  it("maps rpc row with fallback display name and numeric coercion", () => {
    const mapped = mapPopularReaderRow({
      reader_id: "r1",
      display_name: "   ",
      avatar_seed: "seed",
      follower_count: "2",
      shared_gender_count: "1",
      shared_author_count: "3",
      score: "17",
    });

    expect(mapped).toEqual({
      id: "r1",
      displayName: "Leitor",
      avatarSeed: "seed",
      followerCount: 2,
      sharedGenderCount: 1,
      sharedAuthorCount: 3,
      score: 17,
      isFollowing: false,
    });
  });
});

describe("excludeFollowedReaders", () => {
  it("removes readers already followed", () => {
    const result = excludeFollowedReaders(
      [reader({ id: "a" }), reader({ id: "b" }), reader({ id: "c" })],
      ["b"],
    );

    expect(result.map((item) => item.id)).toEqual(["a", "c"]);
  });
});

describe("comparePopularReaders", () => {
  it("orders by score desc then name pt-BR then id", () => {
    const unordered = [
      reader({ id: "2", displayName: "Bruno", score: 5 }),
      reader({ id: "1", displayName: "Ana", score: 10 }),
      reader({ id: "3", displayName: "Ágata", score: 5 }),
      reader({ id: "4", displayName: "Ana", score: 10 }),
    ];

    const ordered = [...unordered].sort(comparePopularReaders);

    expect(ordered.map((item) => item.id)).toEqual(["1", "4", "3", "2"]);
  });
});
