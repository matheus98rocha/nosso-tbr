"use client";

import { BookPlus, Sparkles, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import FollowRecommendationList from "../followRecommendationList";
import type { WelcomeTutorialDialogProps } from "./types/welcomeTutorialDialog.types";

function stepIcon(stepId: WelcomeTutorialDialogProps["currentStep"]["id"]) {
  if (stepId === "follow") {
    return Users;
  }
  if (stepId === "books") {
    return BookPlus;
  }
  return Sparkles;
}

function WelcomeTutorialDialog({
  isOpen,
  onOpenChange,
  steps,
  stepIndex,
  currentStep,
  isLastStep,
  onSkip,
  onNext,
  onBack,
  onStepCta,
  followList,
}: WelcomeTutorialDialogProps) {
  const Icon = stepIcon(currentStep.id);
  const showFollowList = currentStep.id === "follow" && followList;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[90dvh] max-w-md overflow-y-auto",
          showFollowList && "sm:max-w-lg",
        )}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className="flex size-8 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              aria-hidden
            >
              <Icon className="size-4" />
            </span>
            {currentStep.title}
          </DialogTitle>
          <DialogDescription>{currentStep.description}</DialogDescription>
        </DialogHeader>

        {showFollowList ? <FollowRecommendationList {...followList} /> : null}

        <p className="text-sm text-zinc-500 dark:text-zinc-400" aria-live="polite">
          Passo {stepIndex + 1} de {steps.length}
        </p>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            type="button"
            className="h-11 w-full cursor-pointer"
            onClick={onStepCta}
          >
            {currentStep.ctaLabel}
          </Button>
          <div className="flex w-full gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 cursor-pointer"
              onClick={onBack}
              disabled={stepIndex === 0}
            >
              Voltar
            </Button>
            {isLastStep ? (
              <Button
                type="button"
                variant="secondary"
                className="h-11 flex-1 cursor-pointer"
                onClick={onSkip}
              >
                Concluir
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                className="h-11 flex-1 cursor-pointer"
                onClick={onNext}
              >
                Próximo
              </Button>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            className="h-11 w-full cursor-pointer"
            onClick={onSkip}
          >
            Pular tutorial
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default WelcomeTutorialDialog;
