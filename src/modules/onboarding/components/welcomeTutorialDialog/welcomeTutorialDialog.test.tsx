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

    await user.click(
      screen.getByRole("button", { name: "Ver recomendações" }),
    );
    expect(onStepCta).toHaveBeenCalled();
  });
});
