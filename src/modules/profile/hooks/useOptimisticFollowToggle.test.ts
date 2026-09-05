import { act, renderHook } from "@testing-library/react";
import { Mock, beforeEach, describe, expect, it, vi } from "vitest";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useOptimisticFollowToggle } from "./useOptimisticFollowToggle";

vi.mock("@tanstack/react-query", () => ({
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

const { followMock, unfollowMock } = vi.hoisted(() => ({
  followMock: vi.fn().mockResolvedValue(undefined),
  unfollowMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/services/userSocial/userSocial.service", () => ({
  UserSocialService: vi.fn(function (this: Record<string, unknown>) {
    this.follow = followMock;
    this.unfollow = unfollowMock;
  }),
}));

type MutationConfig = {
  mutationFn: (vars: { userId: string; nextFollowing: boolean }) => Promise<void>;
  onMutate: (vars: {
    userId: string;
    nextFollowing: boolean;
  }) => Promise<{ previous: string[] | undefined }>;
  onError: (
    error: unknown,
    vars: unknown,
    context: { previous: string[] | undefined } | undefined,
  ) => void;
  onSettled: () => Promise<void>;
};

describe("useOptimisticFollowToggle — RN67", () => {
  const invalidateQueries = vi.fn().mockResolvedValue(undefined);
  const cancelQueries = vi.fn().mockResolvedValue(undefined);
  const getQueryData = vi.fn();
  const setQueryData = vi.fn();
  const mutate = vi.fn();
  let mutationConfig: MutationConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    (useQueryClient as Mock).mockReturnValue({
      invalidateQueries,
      cancelQueries,
      getQueryData,
      setQueryData,
    });
    (useMutation as Mock).mockImplementation((config: MutationConfig) => {
      mutationConfig = config;
      return {
        mutate,
        isPending: false,
        variables: undefined,
      };
    });
  });

  it("em onSettled invalida following e [\"users\"]", async () => {
    renderHook(() => useOptimisticFollowToggle("me"));

    await mutationConfig.onSettled();

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["userSocial", "following"],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["users"],
    });
  });

  it("não dispara mutate para o próprio usuário", () => {
    const { result } = renderHook(() => useOptimisticFollowToggle("me"));

    act(() => {
      result.current.toggleFollow("me", true);
    });

    expect(mutate).not.toHaveBeenCalled();
  });

  it("dispara mutate follow/unfollow para outro usuário", () => {
    const { result } = renderHook(() => useOptimisticFollowToggle("me"));

    act(() => {
      result.current.toggleFollow("peer", true);
    });

    expect(mutate).toHaveBeenCalledWith({
      userId: "peer",
      nextFollowing: true,
    });
  });
});
