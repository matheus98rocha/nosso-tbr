import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getFollowRecommendations, getFollowingIds, toggleFollow } = vi.hoisted(
  () => ({
    getFollowRecommendations: vi.fn(),
    getFollowingIds: vi.fn(),
    toggleFollow: vi.fn(),
  }),
);

vi.mock("../services/onboarding.service", () => ({
  OnboardingService: vi.fn(function OnboardingServiceMock(this: {
    getFollowRecommendations: typeof getFollowRecommendations;
  }) {
    this.getFollowRecommendations = getFollowRecommendations;
  }),
}));

vi.mock("@/services/userSocial/userSocial.service", () => ({
  UserSocialService: vi.fn(function UserSocialServiceMock(this: {
    getFollowingIds: typeof getFollowingIds;
  }) {
    this.getFollowingIds = getFollowingIds;
  }),
}));

vi.mock("@/modules/profile/hooks/useOptimisticFollowToggle", () => ({
  useOptimisticFollowToggle: () => ({
    toggleFollow,
    isTogglePending: false,
    pendingUserId: null,
  }),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

import { useUserStore } from "@/stores/userStore";

import { useFollowRecommendations } from "./useFollowRecommendations";

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client }, children);
  };
}

describe("useFollowRecommendations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUserStore.setState({
      user: { id: "me" } as never,
      tier: "common_user",
      welcomeTutorialSeenAt: "2026-01-01T00:00:00.000Z",
      sessionReady: true,
      isLoggingOut: false,
      loading: false,
      error: null,
    });
    getFollowingIds.mockResolvedValue([]);
    getFollowRecommendations.mockResolvedValue([
      {
        readerId: "ana",
        displayName: "Ana",
        avatarSeed: null,
        reason: { kind: "shared_genre", gender: "fantasy" },
        registeredCount: 2,
        overlapStrength: 4,
      },
    ]);
  });

  it("mostra nudge e carrega recomendações quando seguindo = 0", async () => {
    const { result } = renderHook(() => useFollowRecommendations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.showNudge).toBe(true);
      expect(result.current.recommendations).toHaveLength(1);
    });

    expect(getFollowRecommendations).toHaveBeenCalledWith("me");
  });

  it("esconde auto-open quando já segue alguém", async () => {
    getFollowingIds.mockResolvedValue(["ana"]);

    const { result } = renderHook(() => useFollowRecommendations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.showNudge).toBe(false);
    });

    expect(getFollowRecommendations).not.toHaveBeenCalled();
  });

  it("continua buscando recomendações com modal aberto após seguir", async () => {
    getFollowingIds.mockResolvedValue(["ana"]);

    const { result } = renderHook(
      () => useFollowRecommendations({ recommendationsEnabled: true }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.showNudge).toBe(false);
      expect(result.current.recommendations).toHaveLength(1);
    });

    expect(getFollowRecommendations).toHaveBeenCalledWith("me");
  });
});
