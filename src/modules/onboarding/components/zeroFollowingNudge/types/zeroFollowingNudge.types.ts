import type { FollowRecommendation } from "../../../types/onboarding.types";

export type ZeroFollowingNudgeProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  recommendations: FollowRecommendation[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onToggleFollow: (readerId: string) => void;
  pendingUserId: string | null;
  isTogglePending: boolean;
};
