import type { CommunityView } from "@/modules/community/types/community.types";

export type CommunityCountsProps = {
  followingCount: number;
  followerCount: number;
  activeView: CommunityView;
  onSelectView: (view: CommunityView) => void;
};
