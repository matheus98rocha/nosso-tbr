import { useMemo, useCallback } from "react";
import { useUserStore } from "@/stores/userStore";
import { useUserSocial } from "./useUserSocial";

function emailLocalPart(email: string) {
  const at = email.indexOf("@");
  return at > 0 ? email.slice(0, at) : email;
}

export function useProfile() {
  const user = useUserStore((state) => state.user);

  const displayName = user?.email ? emailLocalPart(user.email) : "Reader";

  const {
    searchQuery,
    handleSearchChange,
    directoryUsers,
    isLoadingDirectory,
    isFollowing,
    toggleFollow,
    isFollowPending,
    isUnfollowPending,
    pendingUserId,
  } = useUserSocial();

  const isToggleLoading = useMemo(
    () => isFollowPending || isUnfollowPending,
    [isFollowPending, isUnfollowPending],
  );

  const handleFollowPress = useCallback(
    (memberId: string) => {
      toggleFollow(memberId);
    },
    [toggleFollow],
  );

  return {
    user,
    displayName,
    searchQuery,
    handleSearchChange,
    directoryUsers,
    isLoadingDirectory,
    isFollowing,
    handleFollowPress,
    isToggleLoading,
    pendingUserId,
  };
}
