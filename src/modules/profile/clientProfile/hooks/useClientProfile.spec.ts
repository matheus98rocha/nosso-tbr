import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useClientProfile } from "./useClientProfile";
import { useUserStore } from "@/stores/userStore";
import { useUserSocial } from "@/modules/profile/hooks/useUserSocial";

vi.mock("@/stores/userStore", () => ({
  useUserStore: vi.fn(),
}));

vi.mock("@/modules/profile/hooks/useUserSocial", () => ({
  useUserSocial: vi.fn(),
}));

type UserStoreState = {
  user: {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at: string | null;
  } | null;
};

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
    });
  });

  it("deriva displayName pela parte local do email", () => {
    const { result } = renderHook(() => useClientProfile());
    expect(result.current?.displayName).toBe("reader");
  });

  it("retorna null quando não há sessão de usuário", () => {
    (useUserStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (state: UserStoreState) => unknown) => selector({ user: null }),
    );
    const { result } = renderHook(() => useClientProfile());
    expect(result.current).toBeNull();
  });

  it("expõe linhas da comunidade com estado de toggle quando há membros", () => {
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
    });

    const { result } = renderHook(() => useClientProfile());
    expect(result.current?.communityRows).toHaveLength(1);
    expect(result.current?.communityRows[0]?.isFollowing).toBe(true);
    expect(result.current?.communityRows[0]?.memberId).toBe("u2");
  });
});
