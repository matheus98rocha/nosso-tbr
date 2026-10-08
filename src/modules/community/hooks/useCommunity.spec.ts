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

const {
  getMembersPage,
  searchSuggestions,
  getFollowingIds,
  getFollowerIds,
  toggleFollow,
  removeFollower,
  toastError,
} = vi.hoisted(() => ({
  getMembersPage: vi.fn(),
  searchSuggestions: vi.fn(),
  getFollowingIds: vi.fn(),
  getFollowerIds: vi.fn(),
  toggleFollow: vi.fn(),
  removeFollower: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("../services/community.service", () => ({
  CommunityService: vi.fn(function CommunityServiceMock(this: {
    getMembersPage: typeof getMembersPage;
    searchSuggestions: typeof searchSuggestions;
  }) {
    this.getMembersPage = getMembersPage;
    this.searchSuggestions = searchSuggestions;
  }),
}));

vi.mock("@/services/userSocial/userSocial.service", () => ({
  UserSocialService: vi.fn(function UserSocialServiceMock(this: {
    getFollowingIds: typeof getFollowingIds;
    getFollowerIds: typeof getFollowerIds;
  }) {
    this.getFollowingIds = getFollowingIds;
    this.getFollowerIds = getFollowerIds;
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
    getMembersPage.mockResolvedValue({
      members: snapshot.members,
      total: snapshot.members.length,
    });
    searchSuggestions.mockResolvedValue([]);
    getFollowingIds.mockResolvedValue(["ana"]);
    getFollowerIds.mockResolvedValue(["bruno"]);
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
    expect(getMembersPage).toHaveBeenCalledWith(
      expect.objectContaining({
        view: "seguidores",
        search: "",
        page: 0,
        pageSize: 12,
      }),
    );
    expect(result.current.members.map((member) => member.id)).toEqual([
      "ana",
      "bruno",
    ]);
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

  it("não filtra a lista ao digitar e só envia a busca na URL", async () => {
    const { result } = renderHook(() => useCommunity(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.members).toHaveLength(2);
    });

    act(() => {
      result.current.onSearchInputChange("ana");
    });

    expect(result.current.members).toHaveLength(2);
    expect(result.current.inputValue).toBe("ana");
    expect(getMembersPage).toHaveBeenCalledWith(
      expect.objectContaining({ search: "", page: 0 }),
    );

    act(() => {
      result.current.onSubmitSearch("ana");
    });

    expect(nextNavigationTestState.router.replace).toHaveBeenCalledWith(
      "/community?q=ana",
    );
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
    getMembersPage.mockResolvedValue({
      members: snapshot.members,
      total: snapshot.members.length,
    });
    getFollowingIds.mockResolvedValue(["ana", "bruno"]);
    getFollowerIds.mockResolvedValue(["bruno"]);

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
