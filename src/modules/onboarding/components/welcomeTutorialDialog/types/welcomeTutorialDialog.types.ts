import type { WelcomeTutorialStep } from "../../../types/onboarding.types";

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
};
