"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { useSessionSync } from "@/stores/hooks/useSessionSync";
import { useUserStore } from "@/stores/userStore";

import { OnboardingService } from "../services/onboarding.service";
import type { WelcomeTutorialStepId } from "../types/onboarding.types";
import { WELCOME_TUTORIAL_STEPS } from "../utils/welcomeTutorialSteps";

const service = new OnboardingService();

type UseWelcomeTutorialParams = {
  onFollowCta: () => void;
  onBooksCta: () => void;
  onAiCta: () => void;
  enableAutoOpen?: boolean;
};

export function useWelcomeTutorial({
  onFollowCta,
  onBooksCta,
  onAiCta,
  enableAutoOpen = true,
}: UseWelcomeTutorialParams) {
  const sessionInSync = useSessionSync();
  const user = useUserStore((state) => state.user);
  const sessionReady = useUserStore((state) => state.sessionReady);
  const welcomeTutorialSeenAt = useUserStore(
    (state) => state.welcomeTutorialSeenAt,
  );
  const setWelcomeTutorialSeenAt = useUserStore(
    (state) => state.setWelcomeTutorialSeenAt,
  );

  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const hasAutoOpenedRef = useRef(false);
  const markInFlightRef = useRef(false);

  const steps = WELCOME_TUTORIAL_STEPS;
  const currentStep = steps[stepIndex] ?? steps[0];
  const isLastStep = stepIndex >= steps.length - 1;

  const shouldAutoOpen = useMemo(
    () =>
      enableAutoOpen &&
      Boolean(user?.id) &&
      sessionReady &&
      sessionInSync &&
      welcomeTutorialSeenAt === null &&
      !hasAutoOpenedRef.current,
    [
      enableAutoOpen,
      sessionInSync,
      sessionReady,
      user?.id,
      welcomeTutorialSeenAt,
    ],
  );

  const persistSeen = useCallback(async () => {
    if (!user?.id || markInFlightRef.current) {
      return;
    }
    if (useUserStore.getState().welcomeTutorialSeenAt !== null) {
      return;
    }

    markInFlightRef.current = true;
    try {
      const seenAt = await service.markWelcomeTutorialSeen(user.id);
      setWelcomeTutorialSeenAt(seenAt);
    } catch {
      toast.error("Não foi possível salvar o tutorial. Tente de novo.");
    } finally {
      markInFlightRef.current = false;
    }
  }, [setWelcomeTutorialSeenAt, user?.id]);

  const openTutorial = useCallback(
    (options?: { persist?: boolean }) => {
      setStepIndex(0);
      setIsOpen(true);
      if (options?.persist !== false) {
        void persistSeen();
      }
    },
    [persistSeen],
  );

  useEffect(() => {
    if (!shouldAutoOpen) {
      return;
    }
    hasAutoOpenedRef.current = true;
    openTutorial({ persist: true });
  }, [openTutorial, shouldAutoOpen]);

  const closeTutorial = useCallback(() => {
    setIsOpen(false);
    void persistSeen();
  }, [persistSeen]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        setIsOpen(true);
        return;
      }
      closeTutorial();
    },
    [closeTutorial],
  );

  const goNext = useCallback(() => {
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }, [steps.length]);

  const goBack = useCallback(() => {
    setStepIndex((current) => Math.max(current - 1, 0));
  }, []);

  const runStepCta = useCallback(
    (stepId: WelcomeTutorialStepId) => {
      closeTutorial();
      if (stepId === "follow") {
        onFollowCta();
        return;
      }
      if (stepId === "books") {
        onBooksCta();
        return;
      }
      onAiCta();
    },
    [closeTutorial, onAiCta, onBooksCta, onFollowCta],
  );

  const reopenManually = useCallback(() => {
    openTutorial({ persist: false });
  }, [openTutorial]);

  return {
    isOpen,
    steps,
    currentStep,
    stepIndex,
    isLastStep,
    handleOpenChange,
    closeTutorial,
    goNext,
    goBack,
    runStepCta,
    reopenManually,
  };
}
