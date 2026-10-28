"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { QUERY_KEYS } from "@/constants/keys";
import { ApiError } from "@/lib/api/clientJsonFetch";
import type { RegistrationMode } from "@/lib/auth/registrationMode";
import { getRegistrationMode } from "@/services/registration";
import { useIsAdmin, useIsLoggedIn } from "@/stores/hooks/useAuth";
import { useUserStore } from "@/stores/userStore";

import {
  createAdminInvite,
  deleteAdminUser,
  getAdminInvites,
  getAdminUsers,
  promoteAdminUser,
  updateRegistrationMode,
} from "../services/admin.service";
import type { AdminInviteItem, AdminUserListItem } from "../types/admin.types";

export default function useAdmin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isLoggedIn = useIsLoggedIn();
  const isAdmin = useIsAdmin();
  const currentUserId = useUserStore((state) => state.user?.id ?? null);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [copiedRegistrationLink, setCopiedRegistrationLink] = useState(false);
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

  const registrationQuery = useQuery({
    queryKey: QUERY_KEYS.registration.mode,
    queryFn: getRegistrationMode,
    enabled: isLoggedIn && isAdmin,
    staleTime: 1000 * 15,
  });

  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);
  const invites = useMemo(
    () => invitesQuery.data?.invites ?? [],
    [invitesQuery.data?.invites],
  );
  const registrationMode = registrationQuery.data?.mode ?? null;

  const registrationModeDescription = useMemo(() => {
    if (registrationMode === "open") {
      return "Qualquer pessoa pode criar uma conta. O link abaixo abre a inscrição sem convite.";
    }
    if (registrationMode === "invite") {
      return "Só entra quem recebe um convite válido por 24 horas.";
    }
    return "";
  }, [registrationMode]);

  const inviteSectionDescription = useMemo(() => {
    if (registrationMode === "open") {
      return "As inscrições estão abertas, então o link de convite não é obrigatório. Esses links voltam a ser exigidos se você mudar para Convites, enquanto não expirarem.";
    }
    return "Cada link permite múltiplos cadastros até expirar. Gere um novo quando precisar convidar alguém.";
  }, [registrationMode]);

  const openRegistrationUrl = useMemo(() => {
    if (typeof window === "undefined") return "/register";
    return `${window.location.origin}/register`;
  }, []);

  const invalidateUsers = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.users });
  }, [queryClient]);

  const invalidateInvites = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.invites });
  }, [queryClient]);

  const updateRegistrationMutation = useMutation({
    mutationFn: updateRegistrationMode,
    onSuccess: (payload) => {
      queryClient.setQueryData(QUERY_KEYS.registration.mode, payload);
      toast.success(
        payload.mode === "open"
          ? "Inscrições abertas. Qualquer pessoa pode se cadastrar."
          : "Inscrição apenas por convite.",
      );
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : "Não foi possível alterar o modo de inscrição.";
      toast.error(message);
    },
  });

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

  const setRegistrationMode = useCallback(
    (mode: RegistrationMode) => {
      if (mode === registrationMode || updateRegistrationMutation.isPending) {
        return;
      }
      updateRegistrationMutation.mutate(mode);
    },
    [registrationMode, updateRegistrationMutation],
  );

  const copyOpenRegistrationLink = useCallback(() => {
    void navigator.clipboard.writeText(openRegistrationUrl).then(() => {
      setCopiedRegistrationLink(true);
      window.setTimeout(() => {
        setCopiedRegistrationLink(false);
      }, 2000);
    });
  }, [openRegistrationUrl]);

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

  const formatLastSignIn = useCallback((lastSignInAt: string | null) => {
    if (!lastSignInAt) return "Nunca";
    const date = new Date(lastSignInAt);
    const absolute = format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
    const relative = formatDistanceToNow(date, {
      addSuffix: true,
      locale: ptBR,
    });
    return `${absolute} (${relative})`;
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
    inviteSectionDescription,
    registrationMode,
    registrationModeDescription,
    isLoadingRegistration: registrationQuery.isLoading,
    registrationError: registrationQuery.isError,
    setRegistrationMode,
    isUpdatingRegistration: updateRegistrationMutation.isPending,
    openRegistrationUrl,
    copiedRegistrationLink,
    copyOpenRegistrationLink,
    createInvite,
    isCreatingInvite: createInviteMutation.isPending,
    copiedInviteId,
    copyInviteLink,
    formatInviteExpiry,
    formatLastSignIn,
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
