import type { CommunityView } from "@/modules/community/types/community.types";

export type CommunityCountsProps = {
  followingCount: number;
  followerCount: number;
  mutualCount: number;
  activeView: CommunityView;
  onSelectView: (view: CommunityView) => void;
};
