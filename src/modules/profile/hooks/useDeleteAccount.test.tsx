import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/clientJsonFetch";
import { ownAccountDeletionDescription } from "@/lib/users/accountDeletionCopy";
import { nextNavigationTestState } from "@/test/nextNavigationTestState";
import type { User } from "@/types/user.types";
import { useUserStore } from "@/stores/userStore";

import { useDeleteAccount } from "./useDeleteAccount";

const { deleteOwnAccount, toastSuccess, toastError } = vi.hoisted(() => ({
  deleteOwnAccount: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: toastSuccess,
    error: toastError,
  },
}));

vi.mock("../services/deleteAccount.service", () => ({
  deleteOwnAccount,
}));

const reader = { id: "user-1", email: "reader@tbr.com" } as User;

describe("useDeleteAccount", () => {
  const logout = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    deleteOwnAccount.mockReset();
    deleteOwnAccount.mockResolvedValue(undefined);
    toastSuccess.mockReset();
    toastError.mockReset();
    logout.mockClear();
    useUserStore.setState({ user: reader, logout });
  });

  it("avisa que a decisão não é reversível", () => {
    const { result } = renderHook(() => useDeleteAccount());

    expect(result.current.description).toBe(ownAccountDeletionDescription());
    expect(result.current.userId).toBe("user-1");
  });

  it("exclui a própria conta, encerra a sessão e volta para entrar", async () => {
    const { result } = renderHook(() => useDeleteAccount());

    await act(async () => {
      await result.current.confirmDelete("user-1");
    });

    expect(deleteOwnAccount).toHaveBeenCalledTimes(1);
    expect(toastSuccess).toHaveBeenCalledWith("Conta excluída.");
    expect(logout).toHaveBeenCalledTimes(1);
    expect(nextNavigationTestState.router.replace).toHaveBeenCalledWith(
      "/auth",
    );
  });

  it("recusa excluir um id que não é o da sessão", async () => {
    const { result } = renderHook(() => useDeleteAccount());

    await expect(
      act(async () => {
        await result.current.confirmDelete("someone-else");
      }),
    ).rejects.toThrow("Não foi possível excluir a conta.");

    expect(deleteOwnAccount).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith("Não foi possível excluir a conta.");
    expect(logout).not.toHaveBeenCalled();
  });

  it("mostra o erro da API e mantém a sessão", async () => {
    deleteOwnAccount.mockRejectedValue(
      new ApiError("Não é possível excluir o último admin.", 409),
    );
    const { result } = renderHook(() => useDeleteAccount());

    await expect(
      act(async () => {
        await result.current.confirmDelete("user-1");
      }),
    ).rejects.toBeInstanceOf(ApiError);

    expect(toastError).toHaveBeenCalledWith(
      "Não é possível excluir o último admin.",
    );
    expect(logout).not.toHaveBeenCalled();
    expect(nextNavigationTestState.router.replace).not.toHaveBeenCalled();
  });
});
