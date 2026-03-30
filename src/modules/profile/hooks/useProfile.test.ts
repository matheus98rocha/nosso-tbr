import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { useProfile } from "./useProfile";
import { useUserStore } from "@/stores/userStore";
import { useUserSocial } from "./useUserSocial";

vi.mock("@/stores/userStore", () => ({
  useUserStore: vi.fn(),
}));

vi.mock("./useUserSocial", () => ({
  useUserSocial: vi.fn(),
}));

type UserStoreState = {
  user: { id: string; email: string } | null;
};

describe("useProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useUserStore as Mock).mockImplementation(
      (selector: (state: UserStoreState) => unknown) =>
        selector({ user: { id: "1", email: "reader@tbr.com" } }),
    );
    (useUserSocial as Mock).mockReturnValue({
      searchQuery: "",
      handleSearchChange: vi.fn(),
      directoryUsers: [],
      isLoadingDirectory: false,
      isFollowing: vi.fn(),
      toggleFollow: vi.fn(),
      isFollowPending: true,
      isUnfollowPending: false,
      pendingUserId: "2",
    });
  });

  it("deriva displayName pela parte local do email", () => {
    const { result } = renderHook(() => useProfile());
    expect(result.current.displayName).toBe("reader");
  });

  it("expõe isToggleLoading quando follow/unfollow está pendente", () => {
    const { result } = renderHook(() => useProfile());
    expect(result.current.isToggleLoading).toBe(true);
    expect(result.current.pendingUserId).toBe("2");
  });
});
