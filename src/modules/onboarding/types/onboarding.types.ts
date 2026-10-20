export type FollowRecommendationReasonKind = "shared_genre" | "active_reader";

export type FollowRecommendationReason =
  | { kind: "shared_genre"; gender: string }
  | { kind: "active_reader" };

export type FollowRecommendation = {
  readerId: string;
  displayName: string;
  avatarSeed: string | null;
  reason: FollowRecommendationReason;
  registeredCount: number;
  overlapStrength: number;
};

export type FollowRecommendationCandidateInput = {
  id: string;
  displayName: string;
  avatarSeed: string | null;
  genreRows: Array<{
    gender: string;
    finishedCount: number;
    registeredCount: number;
  }>;
  registeredCount: number;
};

export type RankFollowRecommendationsInput = {
  selfId: string;
  followingIds: readonly string[];
  selfGenders: readonly string[];
  candidates: readonly FollowRecommendationCandidateInput[];
  limit?: number;
};

export type WelcomeTutorialStepId = "follow" | "books" | "ai";

export type WelcomeTutorialStep = {
  id: WelcomeTutorialStepId;
  title: string;
  description: string;
  ctaLabel: string;
};
