"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { COMMUNITY_PATH } from "@/lib/routes/community";

import { useWelcomeTutorial } from "../../hooks/useWelcomeTutorial";
import WelcomeTutorialDialog from "../welcomeTutorialDialog";

function ProfileWelcomeTutorial() {
  const router = useRouter();

  const goCommunity = useCallback(() => {
    router.push(COMMUNITY_PATH);
  }, [router]);

  const goHome = useCallback(() => {
    router.push("/");
  }, [router]);

  const tutorial = useWelcomeTutorial({
    enableAutoOpen: false,
    onFollowCta: goCommunity,
    onBooksCta: goHome,
    onAiCta: goHome,
  });

  return (
    <section
      className="overflow-hidden rounded-2xl border border-zinc-200/80 p-4 shadow-sm dark:border-zinc-800 sm:p-6"
      aria-labelledby="welcome-tutorial-heading"
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <h2
            id="welcome-tutorial-heading"
            className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100"
          >
            <BookOpen className="size-5" aria-hidden />
            Tutorial
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Reveja como seguir leitores, cadastrar livros e usar a Indicação com
            IA.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-11 cursor-pointer rounded-xl"
          onClick={tutorial.reopenManually}
        >
          Ver tutorial de novo
        </Button>
      </div>
      <WelcomeTutorialDialog
        isOpen={tutorial.isOpen}
        onOpenChange={tutorial.handleOpenChange}
        steps={tutorial.steps}
        stepIndex={tutorial.stepIndex}
        currentStep={tutorial.currentStep}
        isLastStep={tutorial.isLastStep}
        onSkip={tutorial.closeTutorial}
        onNext={tutorial.goNext}
        onBack={tutorial.goBack}
        onStepCta={() => tutorial.runStepCta(tutorial.currentStep.id)}
      />
    </section>
  );
}

export default ProfileWelcomeTutorial;
