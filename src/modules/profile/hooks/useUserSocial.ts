import { UserSocialService } from "@/services/userSocial/userSocial.service";
import { DirectoryUser } from "@/services/userSocial/types/userSocial.types";
import { useUserStore } from "@/stores/userStore";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";

const service = new UserSocialService();

export function useUserSocial() {
  const queryClient = useQueryClient();
  const currentUser = useUserStore((s) => s.user);
  const isLoggedIn = useIsLoggedIn();
  const [searchQuery, setSearchQuery] = useState("");

  const debouncedSearch = searchQuery.trim();

  const { data: directoryUsers = [], isLoading: isLoadingDirectory } = useQuery({
    queryKey: ["userSocial", "directory", debouncedSearch],
    queryFn: () => service.searchUsers(debouncedSearch),
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 2,
  });

  const { data: followingIds = [] } = useQuery({
    queryKey: ["userSocial", "following", currentUser?.id],
    queryFn: () => service.getFollowingIds(),
    enabled: isLoggedIn && !!currentUser?.id,
    staleTime: 1000 * 60 * 2,
  });

  const followingSet = useMemo(
    () => new Set(followingIds),
    [followingIds],
  );

  const isFollowing = useCallback(
    (userId: string) => followingSet.has(userId),
    [followingSet],
  );

  const followMutation = useMutation({
    mutationFn: (userId: string) => service.follow(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSocial", "following"] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: (userId: string) => service.unfollow(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSocial", "following"] });
    },
  });

  const toggleFollow = useCallback(
    (userId: string) => {
      if (!currentUser?.id || userId === currentUser.id) return;
      if (isFollowing(userId)) {
        unfollowMutation.mutate(userId);
      } else {
        followMutation.mutate(userId);
      }
    },
    [
      currentUser?.id,
      isFollowing,
      followMutation,
      unfollowMutation,
    ],
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const visibleMembers: DirectoryUser[] = useMemo(() => {
    return directoryUsers.filter((u) => u.id !== currentUser?.id);
  }, [directoryUsers, currentUser?.id]);

  return {
    searchQuery,
    handleSearchChange,
    directoryUsers: visibleMembers,
    isLoadingDirectory,
    isFollowing,
    toggleFollow,
    isFollowPending: followMutation.isPending,
    isUnfollowPending: unfollowMutation.isPending,
    pendingUserId:
      followMutation.variables ?? unfollowMutation.variables ?? null,
  };
}
