export const COMMUNITY_PATH = "/community" as const;

export function getMemberProfilePath(userId: string) {
  return `/profile/${userId}` as const;
}
