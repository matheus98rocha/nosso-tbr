import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { WELCOME_TUTORIAL_STEPS } from "../../utils/welcomeTutorialSteps";
import WelcomeTutorialDialog from "./welcomeTutorialDialog";

describe("WelcomeTutorialDialog", () => {
  it("mostra o passo atual e dispara CTA", async () => {
    const user = userEvent.setup();
    const onStepCta = vi.fn();

    render(
      <WelcomeTutorialDialog
        isOpen
        onOpenChange={vi.fn()}
        steps={WELCOME_TUTORIAL_STEPS}
        stepIndex={0}
        currentStep={WELCOME_TUTORIAL_STEPS[0]}
        isLastStep={false}
        onSkip={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
        onStepCta={onStepCta}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Siga outros leitores" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Passo 1 de 3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ver comunidade" }));
    expect(onStepCta).toHaveBeenCalled();
  });

  it("no passo de seguir mostra leitores para seguir sem outro modal", async () => {
    const user = userEvent.setup();
    const onToggleFollow = vi.fn();

    render(
      <WelcomeTutorialDialog
        isOpen
        onOpenChange={vi.fn()}
        steps={WELCOME_TUTORIAL_STEPS}
        stepIndex={0}
        currentStep={WELCOME_TUTORIAL_STEPS[0]}
        isLastStep={false}
        onSkip={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
        onStepCta={vi.fn()}
        followList={{
          recommendations: [
            {
              readerId: "ana",
              displayName: "Ana",
              avatarSeed: null,
              reason: { kind: "shared_genre", gender: "fantasy" },
              registeredCount: 2,
              overlapStrength: 4,
            },
          ],
          isLoading: false,
          isError: false,
          onRetry: vi.fn(),
          onToggleFollow,
          pendingUserId: null,
          isTogglePending: false,
        }}
      />,
    );

    expect(screen.getByText("Também curte Fantasia")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Seguir Ana" }));
    expect(onToggleFollow).toHaveBeenCalledWith("ana");
    expect(
      screen.queryByRole("heading", { name: "Você ainda não segue ninguém" }),
    ).not.toBeInTheDocument();
  });
});
