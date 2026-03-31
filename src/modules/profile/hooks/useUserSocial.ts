import { UserSocialService } from "@/services/userSocial/userSocial.service";
import { useUserStore } from "@/stores/userStore";
import {
  useQuery,
} from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { useClientMounted } from "./useClientMounted";
import { useOptimisticFollowToggle } from "./useOptimisticFollowToggle";

const service = new UserSocialService();

export function useUserSocial() {
  const currentUser = useUserStore((s) => s.user);
  const isLoggedIn = useIsLoggedIn();
  const isClientReady = useClientMounted();
  const [searchQuery, setSearchQuery] = useState("");

  const debouncedSearch = searchQuery.trim();

  const { data: directoryUsers = [], isLoading: isLoadingDirectory } = useQuery({
    queryKey: ["userSocial", "directory", debouncedSearch],
    queryFn: () => service.searchUsers(debouncedSearch),
    enabled: isClientReady && isLoggedIn,
    staleTime: 1000 * 60 * 2,
  });

  const followingQueryKey = useMemo(
    () => ["userSocial", "following", currentUser?.id] as const,
    [currentUser?.id],
  );

  const { data: followingIds = [] } = useQuery({
    queryKey: followingQueryKey,
    queryFn: () => service.getFollowingIds(),
    enabled: isClientReady && isLoggedIn && !!currentUser?.id,
    staleTime: 1000 * 60 * 2,
  });

  const {
    toggleFollow: enqueueFollowToggle,
    isTogglePending,
    pendingUserId,
  } = useOptimisticFollowToggle(currentUser?.id);

  const followingSet = useMemo(
    () => new Set(followingIds),
    [followingIds],
  );

  const isFollowing = useCallback(
    (userId: string) => followingSet.has(userId),
    [followingSet],
  );

  const toggleFollow = useCallback(
    (userId: string) => {
      if (!currentUser?.id || userId === currentUser.id) {
        return;
      }
      enqueueFollowToggle(userId, !isFollowing(userId));
    },
    [currentUser, isFollowing, enqueueFollowToggle],
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const visibleMembers = useMemo(() => {
    return directoryUsers.filter((u) => u.id !== currentUser?.id);
  }, [directoryUsers, currentUser?.id]);

  return {
    searchQuery,
    handleSearchChange,
    directoryUsers: visibleMembers,
    isLoadingDirectory,
    isFollowing,
    toggleFollow,
    isTogglePending,
    pendingUserId,
  };
}
