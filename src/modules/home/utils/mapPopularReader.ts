import { resolveCommunityDisplayName } from "@/modules/community/utils/resolveCommunityDisplayName";

import type {
  PopularReader,
  PopularReaderRpcRow,
} from "../types/popularReaders.types";

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function mapPopularReaderRow(row: PopularReaderRpcRow): PopularReader {
  return {
    id: row.reader_id,
    displayName: resolveCommunityDisplayName(row.display_name),
    avatarSeed: row.avatar_seed,
    followerCount: toNumber(row.follower_count),
    sharedGenderCount: toNumber(row.shared_gender_count),
    sharedAuthorCount: toNumber(row.shared_author_count),
    score: toNumber(row.score),
    isFollowing: false,
  };
}

export function excludeFollowedReaders(
  readers: PopularReader[],
  followingIds: readonly string[],
): PopularReader[] {
  if (followingIds.length === 0) {
    return readers;
  }

  const followingSet = new Set(followingIds);
  return readers.filter((reader) => !followingSet.has(reader.id));
}

export function comparePopularReaders(
  left: PopularReader,
  right: PopularReader,
): number {
  if (right.score !== left.score) {
    return right.score - left.score;
  }

  const byName = left.displayName.localeCompare(right.displayName, "pt-BR");
  if (byName !== 0) {
    return byName;
  }

  return left.id.localeCompare(right.id);
}
