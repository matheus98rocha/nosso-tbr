import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { QUERY_KEYS } from "@/constants/keys";

import type { CommunitySnapshot } from "../types/community.types";
import { useRemoveFollower } from "./useRemoveFollower";

const { removeFollowerMock, toastError } = vi.hoisted(() => ({
  removeFollowerMock: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/services/userSocial/userSocial.service", () => ({
  UserSocialService: vi.fn(function UserSocialServiceMock(this: {
    removeFollower: typeof removeFollowerMock;
  }) {
    this.removeFollower = removeFollowerMock;
  }),
}));

vi.mock("sonner", () => ({
  toast: { error: toastError },
}));

const snapshot: CommunitySnapshot = {
  followingIds: ["ana"],
  followerIds: ["bruno", "carla"],
  members: [
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

function createClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  };
}

describe("useRemoveFollower", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    removeFollowerMock.mockResolvedValue(undefined);
  });

  it("remove o seguidor do snapshot e da lista de seguidores antes da resposta", async () => {
    let resolveRequest: () => void = () => {};
    removeFollowerMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveRequest = resolve;
        }),
    );

    const client = createClient();
    const snapshotKey = QUERY_KEYS.community.snapshot("self-1");
    const followersKey = ["userSocial", "followers", "self-1"] as const;
    client.setQueryData(snapshotKey, snapshot);
    client.setQueryData(followersKey, ["bruno", "carla"]);

    const { result } = renderHook(() => useRemoveFollower("self-1"), {
      wrapper: createWrapper(client),
    });

    act(() => {
      result.current.removeFollower("bruno");
    });

    await waitFor(() => {
      const next = client.getQueryData<CommunitySnapshot>(snapshotKey);
      expect(next?.followerIds).toEqual(["carla"]);
      expect(next?.members[0]?.isFollower).toBe(false);
      expect(client.getQueryData(followersKey)).toEqual(["carla"]);
    });

    resolveRequest();
  });

  it("restaura o snapshot e avisa em pt-BR quando a remoção falha", async () => {
    removeFollowerMock.mockRejectedValue(new Error("rls"));
    const client = createClient();
    const snapshotKey = QUERY_KEYS.community.snapshot("self-1");
    client.setQueryData(snapshotKey, snapshot);

    const { result } = renderHook(() => useRemoveFollower("self-1"), {
      wrapper: createWrapper(client),
    });

    act(() => {
      result.current.removeFollower("bruno");
    });

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        "Não foi possível remover esse seguidor. Tente de novo.",
      );
    });

    expect(client.getQueryData(snapshotKey)).toEqual(snapshot);
  });

  it("não remove o próprio usuário", () => {
    const { result } = renderHook(() => useRemoveFollower("self-1"), {
      wrapper: createWrapper(createClient()),
    });

    act(() => {
      result.current.removeFollower("self-1");
    });

    expect(removeFollowerMock).not.toHaveBeenCalled();
  });
});
