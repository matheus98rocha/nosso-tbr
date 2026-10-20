import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { markWelcomeTutorialSeen } = vi.hoisted(() => ({
  markWelcomeTutorialSeen: vi
    .fn()
    .mockResolvedValue("2026-10-20T00:00:00.000Z"),
}));

vi.mock("../services/onboarding.service", () => ({
  OnboardingService: vi.fn(function OnboardingServiceMock(this: {
    markWelcomeTutorialSeen: typeof markWelcomeTutorialSeen;
  }) {
    this.markWelcomeTutorialSeen = markWelcomeTutorialSeen;
  }),
}));

vi.mock("@/stores/hooks/useSessionSync", () => ({
  useSessionSync: vi.fn(() => true),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

import { useUserStore } from "@/stores/userStore";

import { useWelcomeTutorial } from "./useWelcomeTutorial";

describe("useWelcomeTutorial", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("abre automaticamente quando seenAt é null e marca como visto", async () => {
    const onFollowCta = vi.fn();
    const onBooksCta = vi.fn();
    const onAiCta = vi.fn();

    const { result } = renderHook(() =>
      useWelcomeTutorial({ onFollowCta, onBooksCta, onAiCta }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isOpen).toBe(true);
    expect(markWelcomeTutorialSeen).toHaveBeenCalledWith("me");
  });

  it("não abre automaticamente quando já foi visto", async () => {
    useUserStore.setState({
      welcomeTutorialSeenAt: "2026-10-19T00:00:00.000Z",
    });

    const { result } = renderHook(() =>
      useWelcomeTutorial({
        onFollowCta: vi.fn(),
        onBooksCta: vi.fn(),
        onAiCta: vi.fn(),
      }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isOpen).toBe(false);
    expect(markWelcomeTutorialSeen).not.toHaveBeenCalled();
  });

  it("não abre para visitante", async () => {
    useUserStore.setState({
      user: null,
      welcomeTutorialSeenAt: null,
    });

    const { result } = renderHook(() =>
      useWelcomeTutorial({
        onFollowCta: vi.fn(),
        onBooksCta: vi.fn(),
        onAiCta: vi.fn(),
      }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isOpen).toBe(false);
    expect(markWelcomeTutorialSeen).not.toHaveBeenCalled();
  });

  it("CTA de livros fecha e dispara callback", async () => {
    const onBooksCta = vi.fn();
    const { result } = renderHook(() =>
      useWelcomeTutorial({
        onFollowCta: vi.fn(),
        onBooksCta,
        onAiCta: vi.fn(),
      }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.runStepCta("books");
    });

    expect(result.current.isOpen).toBe(false);
    expect(onBooksCta).toHaveBeenCalled();
  });
});
