import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

import {
  displayNameFromEmail,
  initialsFromDisplayName,
  initialsFromEmail,
} from "@/modules/profile/utils";
import { useClientMounted } from "@/modules/profile/hooks/useClientMounted";
import { UserSocialService } from "@/services/userSocial/userSocial.service";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { useUserStore } from "@/stores/userStore";

import type { HeaderAccountViewModel } from "../types/headerAccount.types";

const userSocialService = new UserSocialService();

export function useHeaderAccount() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const isLoadingUser = useUserStore((state) => state.loading);
  const logout = useUserStore((state) => state.logout);
  const isClientReady = useClientMounted();
  const isLoggedIn = useIsLoggedIn();

  const { data: ownRow, isLoading: isLoadingSocialProfile } = useQuery({
    queryKey: ["userSocial", "user", user?.id],
    queryFn: () => userSocialService.getUserById(user!.id),
    enabled: isClientReady && isLoggedIn && !!user?.id,
    staleTime: 1000 * 60 * 2,
  });

  const account = useMemo((): HeaderAccountViewModel | null => {
    if (!user?.email) {
      return null;
    }

    const displayName =
      ownRow?.displayName?.trim() || displayNameFromEmail(user.email);
    const avatarInitials = ownRow?.displayName?.trim()
      ? initialsFromDisplayName(ownRow.displayName)
      : initialsFromEmail(user.email);

    return {
      displayName,
      email: user.email,
      avatarInitials,
      avatarSeed: ownRow?.avatarSeed ?? null,
    };
  }, [ownRow?.avatarSeed, ownRow?.displayName, user?.email]);

  const isLoading =
    isLoadingUser || (isLoggedIn && !!user?.id && isLoadingSocialProfile);

  const navigateToProfile = useCallback(() => {
    router.push("/profile");
  }, [router]);

  const navigateToAuth = useCallback(() => {
    router.push("/auth");
  }, [router]);

  const handleLogout = useCallback(() => {
    void logout();
  }, [logout]);

  return {
    account,
    isLoading,
    isLoggedIn,
    navigateToProfile,
    navigateToAuth,
    handleLogout,
  };
}
