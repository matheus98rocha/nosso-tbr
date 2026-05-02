import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useClientProfile } from "./useClientProfile";
import { useUserStore } from "@/stores/userStore";
import { useUserSocial } from "@/modules/profile/hooks";

vi.mock("@/stores/userStore", () => ({
  useUserStore: vi.fn(),
}));

vi.mock("@/modules/profile/hooks", () => ({
  useUserSocial: vi.fn(),
}));

vi.mock("@/services/userSocial/userSocial.service", () => {
  const getUserById = vi.fn().mockResolvedValue({
    id: "1",
    displayName: "Reader Public",
    email: "reader@tbr.com",
    joinedAt: null,
  });
  return {
    UserSocialService: class {
      getUserById = getUserById;
    },
  };
});

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
    (useUserSocial as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      searchQuery: "",
      handleSearchChange: vi.fn(),
      directoryUsers: [],
      isLoadingDirectory: false,
      isFollowing: vi.fn(() => false),
      toggleFollow: vi.fn(),
      isTogglePending: true,
      pendingUserId: "2",
      followingCount: 3,
    });
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

  it("expõe contagens e linhas da comunidade com estado de toggle quando há membros", async () => {
    (useUserSocial as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      searchQuery: "",
      handleSearchChange: vi.fn(),
      directoryUsers: [
        {
          id: "u2",
          displayName: "Ana",
          email: "ana@mail.com",
          joinedAt: null,
        },
      ],
      isLoadingDirectory: false,
      isFollowing: vi.fn((id: string) => id === "u2"),
      toggleFollow: vi.fn(),
      isTogglePending: false,
      pendingUserId: null,
      followingCount: 5,
    });

    const { result } = renderHook(() => useClientProfile(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current?.displayName).toBe("Reader Public");
    });

    expect(result.current?.followingCount).toBe(5);
    expect(result.current?.communityRows).toHaveLength(1);
    expect(result.current?.communityRows[0]?.isFollowing).toBe(true);
    expect(result.current?.communityRows[0]?.memberId).toBe("u2");
  });
});
