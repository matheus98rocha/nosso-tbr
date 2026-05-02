import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useClientMounted } from "@/modules/profile/hooks/useClientMounted";
import { useUserSocial } from "@/modules/profile/hooks/useUserSocial";
import { UserSocialService } from "@/services/userSocial/userSocial.service";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";

const service = new UserSocialService();

export function useMemberProfile(userId: string) {
  const isClientReady = useClientMounted();
  const isLoggedIn = useIsLoggedIn();
  const {
    isFollowing,
    toggleFollow,
    isTogglePending,
    pendingUserId,
  } = useUserSocial();

  const profileQuery = useQuery({
    queryKey: ["userSocial", "user", userId],
    queryFn: () => service.getUserById(userId),
    enabled: isClientReady && isLoggedIn && !!userId,
    staleTime: 1000 * 60 * 2,
  });

  const isNotFound = useMemo(() => {
    return profileQuery.isSuccess && profileQuery.data === null;
  }, [profileQuery.isSuccess, profileQuery.data]);

  const toggleBusy = isTogglePending && pendingUserId === userId;

  return {
    profile: profileQuery.data ?? undefined,
    isLoading: profileQuery.isLoading,
    isNotFound,
    isError: profileQuery.isError,
    isFollowing: isFollowing(userId),
    onToggleFollow: () => toggleFollow(userId),
    toggleBusy,
  };
}
