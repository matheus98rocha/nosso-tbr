import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUserStore } from "@/stores/userStore";

import { useClientProfile } from "./useClientProfile";

vi.mock("@/stores/userStore", () => ({
  useUserStore: vi.fn(),
}));

const { getUserById, getFollowingIds, getFollowerIds } = vi.hoisted(() => ({
  getUserById: vi.fn().mockResolvedValue({
    id: "1",
    displayName: "Reader Public",
    email: "reader@tbr.com",
    joinedAt: null,
    avatarSeed: null,
  }),
  getFollowingIds: vi.fn().mockResolvedValue(["a", "b", "c", "d", "e"]),
  getFollowerIds: vi.fn().mockResolvedValue(["x", "y"]),
}));

vi.mock("@/services/userSocial/userSocial.service", () => ({
  UserSocialService: class {
    getUserById = getUserById;
    getFollowingIds = getFollowingIds;
    getFollowerIds = getFollowerIds;
  },
}));

type UserStoreState = {
  user: {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at: string | null;
  } | null;
};

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  };
}

describe("useClientProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useUserStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: UserStoreState) => unknown) =>
        selector({
          user: {
            id: "1",
            email: "reader@tbr.com",
            created_at: "2024-01-15T12:00:00.000Z",
            last_sign_in_at: "2024-06-01T08:00:00.000Z",
          },
        }),
    );
  });

  it("usa display_name público quando disponível", async () => {
    const { result } = renderHook(() => useClientProfile(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current?.displayName).toBe("Reader Public");
    });
  });

  it("retorna null quando não há sessão de usuário", () => {
    (useUserStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: UserStoreState) => unknown) => selector({ user: null }),
    );
    const { result } = renderHook(() => useClientProfile(), {
      wrapper: createWrapper(),
    });
    expect(result.current).toBeNull();
  });

  it("expõe contagens da rede e atalho da comunidade sem diretório", async () => {
    const { result } = renderHook(() => useClientProfile(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current?.followingCount).toBe(5);
    });

    expect(result.current?.followerCount).toBe(2);
    expect(result.current?.communityPath).toBe("/community");
  });
});
