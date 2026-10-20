import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const onboardingMock = vi.hoisted(() => ({
  isOpen: false,
  showNudge: false,
}));

vi.mock("@/modules/onboarding", () => ({
  useWelcomeTutorial: () => ({
    isOpen: onboardingMock.isOpen,
    steps: [],
    currentStep: {
      id: "follow",
      title: "Siga outros leitores",
      description: "",
      ctaLabel: "Ver comunidade",
    },
    stepIndex: 0,
    isLastStep: false,
    handleOpenChange: vi.fn(),
    closeTutorial: vi.fn(),
    goNext: vi.fn(),
    goBack: vi.fn(),
    runStepCta: vi.fn(),
    reopenManually: vi.fn(),
  }),
  useFollowRecommendations: () => ({
    showNudge: onboardingMock.showNudge,
    followingCount: 0,
    recommendations: [],
    isLoading: false,
    isError: false,
    onRetry: vi.fn(),
    onToggleFollow: vi.fn(),
    isTogglePending: false,
    pendingUserId: null,
  }),
}));

import { useUserStore } from "@/stores/userStore";

import { useHomeOnboarding } from "./useHomeOnboarding";

function renderOnboarding() {
  return renderHook(() =>
    useHomeOnboarding({
      onBooksCta: vi.fn(),
      onAiCta: vi.fn(),
    }),
  );
}

describe("useHomeOnboarding", () => {
  beforeEach(() => {
    onboardingMock.isOpen = false;
    onboardingMock.showNudge = false;
    useUserStore.setState({
      user: { id: "me" } as never,
      tier: "common_user",
      welcomeTutorialSeenAt: null,
      sessionReady: true,
      isLoggingOut: false,
      loading: false,
      error: null,
    });
  });

  it("não abre o aviso de zero seguindo junto com o tutorial do primeiro login", () => {
    onboardingMock.isOpen = true;
    onboardingMock.showNudge = true;

    const { result } = renderOnboarding();

    expect(result.current.zeroFollowingOpen).toBe(false);
    expect(result.current.tutorial.isOpen).toBe(true);
  });

  it("não abre o aviso antes do tutorial quando o primeiro login ainda não viu o fluxo", async () => {
    onboardingMock.showNudge = true;

    const { result } = renderOnboarding();

    await waitFor(() => {
      expect(result.current.zeroFollowingOpen).toBe(false);
    });
  });

  it("abre o aviso numa visita em que o tutorial já foi visto", async () => {
    useUserStore.setState({
      welcomeTutorialSeenAt: "2026-10-19T00:00:00.000Z",
    });
    onboardingMock.showNudge = true;

    const { result } = renderOnboarding();

    await waitFor(() => {
      expect(result.current.zeroFollowingOpen).toBe(true);
    });
  });

  it("não abre o aviso na mesma visita depois que o tutorial fecha", async () => {
    onboardingMock.isOpen = true;
    onboardingMock.showNudge = true;
    const view = renderOnboarding();

    expect(view.result.current.zeroFollowingOpen).toBe(false);

    await act(async () => {
      onboardingMock.isOpen = false;
      useUserStore.setState({
        welcomeTutorialSeenAt: "2026-10-20T00:00:00.000Z",
      });
      view.rerender();
    });

    await waitFor(() => {
      expect(view.result.current.zeroFollowingOpen).toBe(false);
    });
  });
});
