export const COMMUNITY_PATH = "/community" as const;

export type CommunityViewPath =
  | "todos"
  | "seguidores"
  | "seguindo"
  | "mutuos";

export function getMemberProfilePath(userId: string) {
  return `/profile/${userId}` as const;
}

export function getCommunityViewPath(view: CommunityViewPath) {
  if (view === "todos") {
    return COMMUNITY_PATH;
  }

  return `${COMMUNITY_PATH}?view=${view}` as const;
}
