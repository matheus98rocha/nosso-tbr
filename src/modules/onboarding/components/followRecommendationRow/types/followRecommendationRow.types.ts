import type { FollowRecommendation } from "../../../types/onboarding.types";

export type FollowRecommendationRowProps = {
  recommendation: FollowRecommendation;
  isToggleBusy: boolean;
  onToggleFollow: () => void;
  index?: number;
};
