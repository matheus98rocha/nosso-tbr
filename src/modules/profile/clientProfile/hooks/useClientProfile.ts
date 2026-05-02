import { useQuery } from "@tanstack/react-query";
import { type ChangeEvent, useCallback, useMemo } from "react";

import type { ClientProfileViewModel } from "@/modules/profile/clientProfile/types/clientProfile.types";
import { useUserSocial } from "@/modules/profile/hooks";
import { useClientMounted } from "@/modules/profile/hooks/useClientMounted";
import {
  formatJoinedDate,
  initialsFromDisplayName,
  initialsFromEmail,
} from "@/modules/profile/utils";
import { UserSocialService } from "@/services/userSocial/userSocial.service";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { useUserStore } from "@/stores/userStore";

function emailLocalPart(email: string) {
  const at = email.indexOf("@");
  return at > 0 ? email.slice(0, at) : email;
}

const service = new UserSocialService();

export function useClientProfile(): ClientProfileViewModel | null {
  const user = useUserStore((state) => state.user);
  const isClientReady = useClientMounted();
  const isLoggedIn = useIsLoggedIn();

  const { data: ownRow } = useQuery({
    queryKey: ["userSocial", "user", user?.id],
    queryFn: () => service.getUserById(user!.id),
    enabled: isClientReady && isLoggedIn && !!user?.id,
    staleTime: 1000 * 60 * 2,
  });

  const {
    searchQuery,
    handleSearchChange,
    directoryUsers,
    isLoadingDirectory,
    isFollowing,
    toggleFollow,
    isTogglePending,
    pendingUserId,
    followingCount,
  } = useUserSocial();

  const onCommunitySearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      handleSearchChange(event.target.value);
    },
    [handleSearchChange],
  );

  const onClearCommunitySearch = useCallback(() => {
    handleSearchChange("");
  }, [handleSearchChange]);

  const handleFollowPress = useCallback(
    (memberId: string) => {
      toggleFollow(memberId);
    },
    [toggleFollow],
  );

  const isToggleLoading = isTogglePending;

  const communityRows = useMemo(() => {
    return directoryUsers.map((member) => ({
      memberId: member.id,
      displayName: member.displayName,
      email: member.email,
      isFollowing: isFollowing(member.id),
      isToggleBusy: isToggleLoading && pendingUserId === member.id,
      onToggle: () => {
        handleFollowPress(member.id);
      },
    }));
  }, [
    directoryUsers,
    isFollowing,
    isToggleLoading,
    pendingUserId,
    handleFollowPress,
  ]);

  return useMemo((): ClientProfileViewModel | null => {
    if (!user?.email) {
      return null;
    }

    const displayName =
      ownRow?.displayName?.trim() || emailLocalPart(user.email);
    const avatarInitials = ownRow?.displayName?.trim()
      ? initialsFromDisplayName(ownRow.displayName)
      : initialsFromEmail(user.email);

    return {
      displayName,
      userEmail: user.email,
      avatarInitials,
      formattedAccountCreated: formatJoinedDate(user.created_at),
      formattedLastSignIn: formatJoinedDate(user.last_sign_in_at),
      followingCount,
      searchQuery,
      onCommunitySearchChange,
      onClearCommunitySearch,
      communityRows,
      isDirectoryLoading: isLoadingDirectory,
      isCommunityEmpty: directoryUsers.length === 0,
    };
  }, [
    user,
    ownRow?.displayName,
    followingCount,
    searchQuery,
    onCommunitySearchChange,
    onClearCommunitySearch,
    communityRows,
    isLoadingDirectory,
    directoryUsers.length,
  ]);
}
