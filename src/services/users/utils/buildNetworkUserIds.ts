export function buildNetworkUserIds(
  currentUserId: string,
  followingIds: string[],
): string[] {
  return [...new Set([currentUserId, ...followingIds.filter(Boolean)])];
}
