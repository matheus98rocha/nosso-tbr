import type { WelcomeTutorialStep } from "../../../types/onboarding.types";
import type { FollowRecommendationListProps } from "../../followRecommendationList";

export type WelcomeTutorialDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  steps: WelcomeTutorialStep[];
  stepIndex: number;
  currentStep: WelcomeTutorialStep;
  isLastStep: boolean;
  onSkip: () => void;
  onNext: () => void;
  onBack: () => void;
  onStepCta: () => void;
  followList?: FollowRecommendationListProps;
};
