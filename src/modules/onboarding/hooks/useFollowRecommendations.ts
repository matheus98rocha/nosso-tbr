"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";

import { QUERY_KEYS } from "@/constants/keys";
import { useOptimisticFollowToggle } from "@/modules/profile/hooks/useOptimisticFollowToggle";
import { UserSocialService } from "@/services/userSocial/userSocial.service";
import { useUserStore } from "@/stores/userStore";

import { OnboardingService } from "../services/onboarding.service";

const onboardingService = new OnboardingService();
const userSocialService = new UserSocialService();

export function useFollowRecommendations() {
  const user = useUserStore((state) => state.user);
  const userId = user?.id;
  const queryClient = useQueryClient();

  const followingQueryKey = useMemo(
    () => ["userSocial", "following", userId] as const,
    [userId],
  );

  const followingQuery = useQuery({
    queryKey: followingQueryKey,
    queryFn: () => userSocialService.getFollowingIds(),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });

  const followingIds = followingQuery.data ?? [];
  const followingCount = followingIds.length;
  const showNudge = Boolean(userId) && followingQuery.isFetched && followingCount === 0;

  const recommendationsQuery = useQuery({
    queryKey: QUERY_KEYS.onboarding.recommendations(userId ?? ""),
    queryFn: () => onboardingService.getFollowRecommendations(userId!),
    enabled: showNudge && Boolean(userId),
    staleTime: 60_000,
  });

  const handleToggleError = useCallback(() => {
    toast.error("Não foi possível atualizar o seguir. Tente de novo.");
  }, []);

  const { toggleFollow, isTogglePending, pendingUserId } =
    useOptimisticFollowToggle(userId, { onToggleError: handleToggleError });

  const onToggleFollow = useCallback(
    (readerId: string) => {
      toggleFollow(readerId, true);
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.onboarding.all,
      });
    },
    [queryClient, toggleFollow],
  );

  return {
    showNudge,
    followingCount,
    recommendations: recommendationsQuery.data ?? [],
    isLoading:
      followingQuery.isLoading ||
      (showNudge && recommendationsQuery.isLoading),
    isError: recommendationsQuery.isError,
    onRetry: () => {
      void recommendationsQuery.refetch();
    },
    onToggleFollow,
    isTogglePending,
    pendingUserId,
  };
}
