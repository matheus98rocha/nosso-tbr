"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { COMMUNITY_PATH } from "@/lib/routes/community";
import {
  useFollowRecommendations,
  useWelcomeTutorial,
} from "@/modules/onboarding";
import { useUserStore } from "@/stores/userStore";

import type { UseHomeOnboardingParams } from "./useHomeOnboarding.types";

export function useHomeOnboarding({
  onBooksCta,
  onAiCta,
}: UseHomeOnboardingParams) {
  const router = useRouter();
  const sessionReady = useUserStore((state) => state.sessionReady);
  const welcomeTutorialSeenAt = useUserStore(
    (state) => state.welcomeTutorialSeenAt,
  );
  const [zeroFollowingHeldOpen, setZeroFollowingHeldOpen] = useState(false);
  const zeroFollowingAutoOpenedRef = useRef(false);
  const tutorialPresentedThisSessionRef = useRef(false);

  const openCommunity = useCallback(() => {
    router.push(COMMUNITY_PATH);
  }, [router]);

  const tutorial = useWelcomeTutorial({
    onFollowCta: openCommunity,
    onBooksCta,
    onAiCta,
  });

  if (tutorial.isOpen) {
    tutorialPresentedThisSessionRef.current = true;
  }

  const followRecommendations = useFollowRecommendations({
    recommendationsEnabled:
      zeroFollowingHeldOpen ||
      tutorial.isOpen ||
      (sessionReady && welcomeTutorialSeenAt === null),
  });

  const blockZeroFollowingNudge =
    !sessionReady ||
    tutorial.isOpen ||
    welcomeTutorialSeenAt === null ||
    tutorialPresentedThisSessionRef.current;

  useEffect(() => {
    if (blockZeroFollowingNudge) {
      return;
    }
    if (
      followRecommendations.showNudge &&
      !zeroFollowingHeldOpen &&
      !zeroFollowingAutoOpenedRef.current
    ) {
      zeroFollowingAutoOpenedRef.current = true;
      setZeroFollowingHeldOpen(true);
    }
  }, [
    blockZeroFollowingNudge,
    followRecommendations.showNudge,
    zeroFollowingHeldOpen,
  ]);

  const handleZeroFollowingOpenChange = useCallback((open: boolean) => {
    if (!open) {
      zeroFollowingAutoOpenedRef.current = true;
    }
    setZeroFollowingHeldOpen(open);
  }, []);

  const followList = useMemo(
    () => ({
      recommendations: followRecommendations.recommendations,
      isLoading: followRecommendations.isLoading,
      isError: followRecommendations.isError,
      onRetry: followRecommendations.onRetry,
      onToggleFollow: followRecommendations.onToggleFollow,
      pendingUserId: followRecommendations.pendingUserId,
      isTogglePending: followRecommendations.isTogglePending,
    }),
    [
      followRecommendations.isError,
      followRecommendations.isLoading,
      followRecommendations.isTogglePending,
      followRecommendations.onRetry,
      followRecommendations.onToggleFollow,
      followRecommendations.pendingUserId,
      followRecommendations.recommendations,
    ],
  );

  return {
    tutorial,
    followList,
    followRecommendations,
    zeroFollowingOpen: zeroFollowingHeldOpen && !tutorial.isOpen,
    handleZeroFollowingOpenChange,
  };
}
