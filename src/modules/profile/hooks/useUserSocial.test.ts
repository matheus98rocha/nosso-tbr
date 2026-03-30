import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { useUserSocial } from "./useUserSocial";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUserStore } from "@/stores/userStore";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock("@/stores/userStore", () => ({
  useUserStore: vi.fn(),
}));

vi.mock("@/stores/hooks/useAuth", () => ({
  useIsLoggedIn: vi.fn(),
}));

type UserStoreState = {
  user: { id: string; email: string } | null;
};

describe("useUserSocial", () => {
  const invalidateQueries = vi.fn();
  const followMutate = vi.fn();
  const unfollowMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useQueryClient as Mock).mockReturnValue({ invalidateQueries });
    (useUserStore as Mock).mockImplementation(
      (selector: (state: UserStoreState) => unknown) =>
        selector({ user: { id: "me", email: "me@mail.com" } }),
    );
    (useIsLoggedIn as Mock).mockReturnValue(true);

    (useQuery as Mock)
      .mockReturnValueOnce({
        data: [
          { id: "me", displayName: "Eu", email: "me@mail.com" },
          { id: "u2", displayName: "Ana", email: "ana@mail.com" },
        ],
        isLoading: false,
      })
      .mockReturnValueOnce({
        data: ["u2"],
      });

    (useMutation as Mock)
      .mockReturnValueOnce({
        mutate: followMutate,
        isPending: false,
        variables: undefined,
      })
      .mockReturnValueOnce({
        mutate: unfollowMutate,
        isPending: false,
        variables: undefined,
      });
  });

  it("aplica guard de autenticação nas queries", () => {
    (useIsLoggedIn as Mock).mockReturnValue(false);
    renderHook(() => useUserSocial());

    expect(useQuery).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ enabled: false }),
    );
    expect(useQuery).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ enabled: false }),
    );
  });

  it("remove o usuário logado da lista visível", () => {
    const { result } = renderHook(() => useUserSocial());

    expect(result.current.directoryUsers).toEqual([
      { id: "u2", displayName: "Ana", email: "ana@mail.com" },
    ]);
  });

  it("faz unfollow quando usuário já está sendo seguido", () => {
    const { result } = renderHook(() => useUserSocial());

    act(() => {
      result.current.toggleFollow("u2");
    });

    expect(unfollowMutate).toHaveBeenCalledWith("u2");
    expect(followMutate).not.toHaveBeenCalled();
  });

  it("ignora toggle quando tenta seguir a si mesmo", () => {
    const { result } = renderHook(() => useUserSocial());

    act(() => {
      result.current.toggleFollow("me");
    });

    expect(unfollowMutate).not.toHaveBeenCalled();
    expect(followMutate).not.toHaveBeenCalled();
  });
});
