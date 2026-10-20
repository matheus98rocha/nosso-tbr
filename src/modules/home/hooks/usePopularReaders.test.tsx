import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import usePopularReaders from "./usePopularReaders";

const {
  listMock,
  getFollowingIdsMock,
  toggleFollowMock,
  hideMock,
  showMock,
} = vi.hoisted(() => ({
  listMock: vi.fn(),
  getFollowingIdsMock: vi.fn(),
  toggleFollowMock: vi.fn(),
  hideMock: vi.fn(),
  showMock: vi.fn(),
}));

vi.mock("./usePopularReadersPreference", () => ({
  default: () => ({
    hidden: false,
    hide: hideMock,
    show: showMock,
    isReady: true,
  }),
}));

vi.mock("@/modules/profile/hooks/useOptimisticFollowToggle", () => ({
  useOptimisticFollowToggle: () => ({
    toggleFollow: toggleFollowMock,
    isTogglePending: false,
    pendingUserId: null,
  }),
}));

vi.mock("@/stores/hooks/useAuth", () => ({
  useIsLoggedIn: () => true,
}));

vi.mock("@/stores/userStore", () => ({
  useUserStore: (selector: (state: { user: { id: string } }) => unknown) =>
    selector({ user: { id: "self" } }),
}));

vi.mock("../services/popularReaders.service", () => ({
  PopularReadersService: vi.fn(function (this: { list: typeof listMock }) {
    this.list = listMock;
  }),
}));

vi.mock("@/services/userSocial/userSocial.service", () => ({
  UserSocialService: vi.fn(function (this: {
    getFollowingIds: typeof getFollowingIdsMock;
  }) {
    this.getFollowingIds = getFollowingIdsMock;
  }),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe("usePopularReaders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listMock.mockResolvedValue([
      {
        id: "a",
        displayName: "Ana",
        avatarSeed: null,
        followerCount: 2,
        sharedGenderCount: 1,
        sharedAuthorCount: 0,
        score: 5,
        isFollowing: false,
      },
      {
        id: "b",
        displayName: "Bia",
        avatarSeed: null,
        followerCount: 1,
        sharedGenderCount: 0,
        sharedAuthorCount: 0,
        score: 1,
        isFollowing: false,
      },
    ]);
    getFollowingIdsMock.mockResolvedValue(["b"]);
  });

  it("excludes already followed readers and follows with cache removal", async () => {
    const { result } = renderHook(() => usePopularReaders(), { wrapper });

    await waitFor(() => {
      expect(result.current.shouldRender).toBe(true);
      expect(result.current.readers.map((reader) => reader.id)).toEqual(["a"]);
    });

    act(() => {
      result.current.follow("a");
    });

    expect(toggleFollowMock).toHaveBeenCalledWith("a", true);
    await waitFor(() => {
      expect(result.current.readers).toEqual([]);
    });
  });
});
