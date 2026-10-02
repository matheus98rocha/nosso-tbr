import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { nextNavigationTestState } from "@/test/nextNavigationTestState";

import type { CommunitySnapshot } from "../types/community.types";
import { useCommunity } from "./useCommunity";

const snapshot: CommunitySnapshot = {
  followingIds: ["ana"],
  followerIds: ["bruno"],
  members: [
    {
      id: "ana",
      displayName: "Ana",
      avatarSeed: null,
      isFollowing: true,
      isFollower: false,
      mostReadGender: "fantasy",
      mostRegisteredGender: "fiction",
      registeredCount: 12,
      finishedCount: 8,
      currentlyReadingTitle: "O Nome do Vento",
    },
    {
      id: "bruno",
      displayName: "Bruno",
      avatarSeed: null,
      isFollowing: false,
      isFollower: true,
      mostReadGender: null,
      mostRegisteredGender: null,
      registeredCount: 0,
      finishedCount: 0,
      currentlyReadingTitle: null,
    },
  ],
};

const { getSnapshot, getFollowingIds, toggleFollow, removeFollower, toastError } =
  vi.hoisted(() => ({
    getSnapshot: vi.fn(),
    getFollowingIds: vi.fn(),
    toggleFollow: vi.fn(),
    removeFollower: vi.fn(),
    toastError: vi.fn(),
  }));

vi.mock("../services/community.service", () => ({
  CommunityService: vi.fn(function CommunityServiceMock(this: {
    getSnapshot: typeof getSnapshot;
  }) {
    this.getSnapshot = getSnapshot;
  }),
}));

vi.mock("@/services/userSocial/userSocial.service", () => ({
  UserSocialService: vi.fn(function UserSocialServiceMock(this: {
    getFollowingIds: typeof getFollowingIds;
  }) {
    this.getFollowingIds = getFollowingIds;
  }),
}));

vi.mock("./useRemoveFollower", () => ({
  useRemoveFollower: () => ({
    removeFollower,
    isRemovePending: false,
    pendingRemovalUserId: null,
  }),
}));

vi.mock("@/modules/profile/hooks/useOptimisticFollowToggle", () => ({
  useOptimisticFollowToggle: () => ({
    toggleFollow,
    isTogglePending: false,
    pendingUserId: null,
  }),
}));

vi.mock("@/modules/profile/hooks/useClientMounted", () => ({
  useClientMounted: () => true,
}));

vi.mock("@/stores/userStore", () => ({
  useUserStore: (selector: (state: { user: { id: string } | null }) => unknown) =>
    selector({ user: { id: "self-1" } }),
}));

vi.mock("@/stores/hooks/useAuth", () => ({
  useIsLoggedIn: () => true,
}));

vi.mock("sonner", () => ({
  toast: { error: toastError, success: vi.fn() },
}));

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  };
}

describe("useCommunity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nextNavigationTestState.pathname = "/community";
    nextNavigationTestState.searchParamsSerialized = "";
    getSnapshot.mockResolvedValue(snapshot);
    getFollowingIds.mockResolvedValue(["ana"]);
  });

  it("expõe contagens pelos IDs da rede independente do recorte", async () => {
    nextNavigationTestState.searchParamsSerialized = "view=seguidores";

    const { result } = renderHook(() => useCommunity(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.followingCount).toBe(1);
    });

    expect(result.current.followerCount).toBe(1);
    expect(result.current.view).toBe("seguidores");
    expect(result.current.members.map((member) => member.id)).toEqual(["bruno"]);
  });

  it("troca o recorte na URL com router.replace", async () => {
    const { result } = renderHook(() => useCommunity(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.members.length).toBeGreaterThan(0);
    });

    act(() => {
      result.current.setView("seguindo");
    });

    expect(nextNavigationTestState.router.replace).toHaveBeenCalledWith(
      "/community?view=seguindo",
    );
  });

  it("filtra por nome sem mudar as contagens", async () => {
    const { result } = renderHook(() => useCommunity(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.members).toHaveLength(2);
    });

    act(() => {
      result.current.onSearchChange("ana");
    });

    expect(result.current.members.map((member) => member.id)).toEqual(["ana"]);
    expect(result.current.followingCount).toBe(1);
    expect(result.current.followerCount).toBe(1);
  });

  it("dispara toggle de seguir com o estado invertido", async () => {
    const { result } = renderHook(() => useCommunity(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.members.length).toBe(2);
    });

    act(() => {
      result.current.onToggleFollow("bruno");
    });

    expect(toggleFollow).toHaveBeenCalledWith("bruno", true);
  });

  it("conta mútuos pela interseção e pede remoção só de quem segue o usuário", async () => {
    getSnapshot.mockResolvedValue({
      ...snapshot,
      followingIds: ["ana", "bruno"],
      members: snapshot.members.map((member) =>
        member.id === "bruno" ? { ...member, isFollowing: true } : member,
      ),
    });
    getFollowingIds.mockResolvedValue(["ana", "bruno"]);

    const { result } = renderHook(() => useCommunity(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.mutualCount).toBe(1);
    });

    act(() => {
      result.current.onRequestRemoveFollower("ana");
    });
    expect(result.current.removalMember).toBeNull();

    act(() => {
      result.current.onRequestRemoveFollower("bruno");
    });
    expect(result.current.removalMember?.displayName).toBe("Bruno");

    act(() => {
      result.current.onConfirmRemoveFollower();
    });

    expect(removeFollower).toHaveBeenCalledWith("bruno", expect.any(Object));
  });
});
