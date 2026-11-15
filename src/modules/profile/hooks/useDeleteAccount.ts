"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { ApiError } from "@/lib/api/clientJsonFetch";
import { ownAccountDeletionDescription } from "@/lib/users/accountDeletionCopy";
import { useUserStore } from "@/stores/userStore";

import { deleteOwnAccount } from "../services/deleteAccount.service";

export function useDeleteAccount() {
  const router = useRouter();
  const userId = useUserStore((state) => state.user?.id ?? null);
  const logout = useUserStore((state) => state.logout);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const description = useMemo(() => ownAccountDeletionDescription(), []);

  const openConfirm = useCallback(() => {
    setIsConfirmOpen(true);
  }, []);

  const closeConfirm = useCallback(() => {
    setIsConfirmOpen(false);
  }, []);

  const onConfirmOpenChange = useCallback((open: boolean) => {
    setIsConfirmOpen(open);
  }, []);

  const confirmDelete = useCallback(
    async (requestedUserId: string) => {
      if (!userId || requestedUserId !== userId) {
        const message = "Não foi possível excluir a conta.";
        toast.error(message);
        throw new Error(message);
      }

      try {
        await deleteOwnAccount();
      } catch (error: unknown) {
        const message =
          error instanceof ApiError
            ? error.message
            : "Não foi possível excluir a conta.";
        toast.error(message);
        throw error;
      }

      toast.success("Conta excluída.");
      await logout();
      router.replace("/auth");
    },
    [logout, router, userId],
  );

  return {
    userId,
    description,
    isConfirmOpen,
    openConfirm,
    closeConfirm,
    onConfirmOpenChange,
    confirmDelete,
  };
}
