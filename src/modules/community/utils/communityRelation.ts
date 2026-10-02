export type CommunityRelationMark = {
  id: "following" | "follower";
  label: string;
};

export function listCommunityRelationMarks(input: {
  isFollowing: boolean;
  isFollower: boolean;
}): CommunityRelationMark[] {
  const marks: CommunityRelationMark[] = [];

  if (input.isFollowing) {
    marks.push({ id: "following", label: "Você segue" });
  }

  if (input.isFollower) {
    marks.push({ id: "follower", label: "Te segue" });
  }

  return marks;
}

export function countMutualFollows(
  followingIds: readonly string[],
  followerIds: readonly string[],
): number {
  if (followingIds.length === 0 || followerIds.length === 0) {
    return 0;
  }

  const followers = new Set(followerIds);
  let count = 0;

  for (const id of followingIds) {
    if (followers.has(id)) {
      count += 1;
    }
  }

  return count;
}
