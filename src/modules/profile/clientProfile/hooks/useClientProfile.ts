import { type ChangeEvent, useCallback, useMemo } from "react";
import type { ClientProfileViewModel } from "@/modules/profile/clientProfile/types/clientProfile.types";
import { useUserSocial } from "@/modules/profile/hooks";
import { formatJoinedDate, initialsFromEmail } from "@/modules/profile/utils";
import { useUserStore } from "@/stores/userStore";

function emailLocalPart(email: string) {
  const at = email.indexOf("@");
  return at > 0 ? email.slice(0, at) : email;
}

export function useClientProfile(): ClientProfileViewModel | null {
  const user = useUserStore((state) => state.user);

  const {
    searchQuery,
    handleSearchChange,
    directoryUsers,
    isLoadingDirectory,
    isFollowing,
    toggleFollow,
    isTogglePending,
    pendingUserId,
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

    return {
      displayName: emailLocalPart(user.email),
      userEmail: user.email,
      avatarInitials: initialsFromEmail(user.email),
      formattedAccountCreated: formatJoinedDate(user.created_at),
      formattedLastSignIn: formatJoinedDate(user.last_sign_in_at),
      searchQuery,
      onCommunitySearchChange,
      onClearCommunitySearch,
      communityRows,
      isDirectoryLoading: isLoadingDirectory,
      isCommunityEmpty: directoryUsers.length === 0,
    };
  }, [
    user,
    searchQuery,
    onCommunitySearchChange,
    onClearCommunitySearch,
    communityRows,
    isLoadingDirectory,
    directoryUsers.length,
  ]);
}
