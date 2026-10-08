import type { CommunityView } from "../types/community.types";

export const COMMUNITY_PAGE_SIZE = 12;
export const COMMUNITY_SUGGESTION_LIMIT = 8;
export const COMMUNITY_SUGGESTION_MIN_LENGTH = 2;

export function parseCommunityPage(raw: string | null | undefined): number {
  if (!raw) {
    return 0;
  }

  const page = Number(raw);

  if (!Number.isInteger(page) || page < 0) {
    return 0;
  }

  return page;
}

export function resolveCommunityMemberIds(
  view: CommunityView,
  followingIds: readonly string[],
  followerIds: readonly string[],
): readonly string[] | null {
  if (view === "todos") {
    return null;
  }

  if (view === "seguindo") {
    return followingIds;
  }

  if (view === "seguidores") {
    return followerIds;
  }

  const followers = new Set(followerIds);

  return followingIds.filter((id) => followers.has(id));
}

export function toCommunityNamePattern(search: string): string | null {
  const trimmed = search.trim();

  if (!trimmed) {
    return null;
  }

  const escaped = trimmed.replace(/[%_\\]/g, "\\$&");

  return `%${escaped}%`;
}
