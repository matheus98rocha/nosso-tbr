"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { QUERY_KEYS } from "@/constants/keys";
import { ApiError } from "@/lib/api/clientJsonFetch";
import { useIsAdmin, useIsLoggedIn } from "@/stores/hooks/useAuth";
import { useUserStore } from "@/stores/userStore";

import {
  createAdminInvite,
  deleteAdminUser,
  getAdminInvites,
  getAdminUsers,
  promoteAdminUser,
} from "../services/admin.service";
import type { AdminInviteItem, AdminUserListItem } from "../types/admin.types";

export default function useAdmin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isLoggedIn = useIsLoggedIn();
  const isAdmin = useIsAdmin();
  const currentUserId = useUserStore((state) => state.user?.id ?? null);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
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

  const invitesQuery = useQuery({
    queryKey: QUERY_KEYS.admin.invites,
    queryFn: getAdminInvites,
    enabled: isLoggedIn && isAdmin,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });

  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);
  const invites = useMemo(
    () => invitesQuery.data?.invites ?? [],
    [invitesQuery.data?.invites],
  );

  const invalidateUsers = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.users });
  }, [queryClient]);

  const invalidateInvites = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.invites });
  }, [queryClient]);

  const createInviteMutation = useMutation({
    mutationFn: createAdminInvite,
    onSuccess: () => {
      toast.success("Convite gerado. Válido por 24 horas.");
      invalidateInvites();
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Não foi possível gerar o convite.";
      toast.error(message);
    },
  });

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

  const createInvite = useCallback(() => {
    createInviteMutation.mutate();
  }, [createInviteMutation]);

  const copyInviteLink = useCallback(async (invite: AdminInviteItem) => {
    await navigator.clipboard.writeText(invite.inviteUrl);
    setCopiedInviteId(invite.id);
    window.setTimeout(() => {
      setCopiedInviteId((current) =>
        current === invite.id ? null : current,
      );
    }, 2000);
  }, []);

  const formatInviteExpiry = useCallback((expiresAt: string) => {
    const date = new Date(expiresAt);
    const absolute = format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
    const relative = formatDistanceToNow(date, {
      addSuffix: true,
      locale: ptBR,
    });
    return `${absolute} (${relative})`;
  }, []);

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
    invites,
    isLoadingInvites: invitesQuery.isLoading,
    invitesError: invitesQuery.error,
    createInvite,
    isCreatingInvite: createInviteMutation.isPending,
    copiedInviteId,
    copyInviteLink,
    formatInviteExpiry,
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
