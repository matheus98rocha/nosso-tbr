"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ApiError } from "@/lib/api/clientJsonFetch";
import { QUERY_KEYS } from "@/constants/keys";
import { useIsAdmin, useIsLoggedIn } from "@/stores/hooks/useAuth";
import { useUserStore } from "@/stores/userStore";

import type { AdminUserListItem } from "../types/admin.types";
import {
  deleteAdminUser,
  getAdminInviteLink,
  getAdminUsers,
  promoteAdminUser,
} from "../services/admin.service";

export default function useAdmin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isLoggedIn = useIsLoggedIn();
  const isAdmin = useIsAdmin();
  const currentUserId = useUserStore((state) => state.user?.id ?? null);
  const [copied, setCopied] = useState(false);
  const [userPendingDelete, setUserPendingDelete] =
    useState<AdminUserListItem | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/auth");
      return;
    }
    if (!isAdmin) {
      router.replace("/");
    }
  }, [isAdmin, isLoggedIn, router]);

  const usersQuery = useQuery({
    queryKey: QUERY_KEYS.admin.users,
    queryFn: getAdminUsers,
    enabled: isLoggedIn && isAdmin,
    staleTime: 1000 * 60 * 5,
  });

  const inviteQuery = useQuery({
    queryKey: QUERY_KEYS.admin.inviteLink,
    queryFn: getAdminInviteLink,
    enabled: isLoggedIn && isAdmin,
    staleTime: 1000 * 60 * 5,
  });

  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);

  const inviteUrl = inviteQuery.data?.inviteUrl ?? null;
  const inviteConfigured = inviteQuery.data?.configured ?? false;

  const invalidateUsers = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.users });
  }, [queryClient]);

  const promoteMutation = useMutation({
    mutationFn: promoteAdminUser,
    onSuccess: () => {
      toast.success("Usuário promovido a admin.");
      invalidateUsers();
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Não foi possível promover o usuário.";
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: () => {
      toast.success("Usuário excluído.");
      setUserPendingDelete(null);
      invalidateUsers();
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Não foi possível excluir o usuário.";
      toast.error(message);
    },
  });

  const copyInviteLink = useCallback(async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [inviteUrl]);

  const tierLabel = useCallback((tier: string) => {
    if (tier === "admin") return "Admin";
    return "Common-user";
  }, []);

  const openDeleteConfirm = useCallback((user: AdminUserListItem) => {
    setUserPendingDelete(user);
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    setUserPendingDelete(null);
  }, []);

  const confirmDeleteUser = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id);
    },
    [deleteMutation],
  );

  const promoteUser = useCallback(
    (userId: string) => {
      promoteMutation.mutate(userId);
    },
    [promoteMutation],
  );

  const canDeleteUser = useCallback(
    (user: AdminUserListItem) => user.id !== currentUserId,
    [currentUserId],
  );

  const canPromoteUser = useCallback(
    (user: AdminUserListItem) => user.tier !== "admin",
    [],
  );

  return {
    isAdmin,
    isLoggedIn,
    users,
    isLoadingUsers: usersQuery.isLoading,
    usersError: usersQuery.error,
    inviteUrl,
    inviteConfigured,
    isLoadingInvite: inviteQuery.isLoading,
    inviteError: inviteQuery.error,
    copied,
    copyInviteLink,
    tierLabel,
    userPendingDelete,
    openDeleteConfirm,
    closeDeleteConfirm,
    confirmDeleteUser,
    promoteUser,
    canDeleteUser,
    canPromoteUser,
    isPromoting: promoteMutation.isPending,
    isDeleting: deleteMutation.isPending,
    promotingUserId: promoteMutation.isPending
      ? (promoteMutation.variables ?? null)
      : null,
  };
}
