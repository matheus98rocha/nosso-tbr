import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { QUERY_KEYS } from "@/constants/keys";
import { getMemberProfilePath } from "@/lib/routes/community";
import { useClientMounted } from "@/modules/profile/hooks/useClientMounted";
import { useOptimisticFollowToggle } from "@/modules/profile/hooks/useOptimisticFollowToggle";
import { UserSocialService } from "@/services/userSocial/userSocial.service";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { useUserStore } from "@/stores/userStore";

import { CommunityService } from "../services/community.service";
import type {
  CommunityView,
  CommunityViewModel,
} from "../types/community.types";
import {
  filterCommunityMembers,
  parseCommunityView,
} from "../utils/filterCommunityMembers";

const communityService = new CommunityService();
const userSocialService = new UserSocialService();

const FOLLOW_ERROR_MESSAGE =
  "Não foi possível atualizar o seguir. Tente de novo.";

export function useCommunity(): CommunityViewModel {
  const user = useUserStore((state) => state.user);
  const isLoggedIn = useIsLoggedIn();
  const isClientReady = useClientMounted();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const view = parseCommunityView(searchParams.get("view"));
  const selfId = user?.id ?? "";
  const queryEnabled = isClientReady && isLoggedIn && Boolean(selfId);

  const handleToggleError = useCallback(() => {
    toast.error(FOLLOW_ERROR_MESSAGE);
  }, []);

  const snapshotQuery = useQuery({
    queryKey: QUERY_KEYS.community.snapshot(selfId),
    queryFn: () => communityService.getSnapshot(selfId),
    enabled: queryEnabled,
    staleTime: 1000 * 60 * 2,
  });

  const followingQuery = useQuery({
    queryKey: ["userSocial", "following", selfId] as const,
    queryFn: () => userSocialService.getFollowingIds(),
    enabled: queryEnabled,
    staleTime: 1000 * 60 * 2,
  });

  const {
    toggleFollow: enqueueFollowToggle,
    isTogglePending,
    pendingUserId,
  } = useOptimisticFollowToggle(user?.id, {
    onToggleError: handleToggleError,
  });

  const followingIds = useMemo(
    () => followingQuery.data ?? snapshotQuery.data?.followingIds ?? [],
    [followingQuery.data, snapshotQuery.data?.followingIds],
  );

  const followerIds = snapshotQuery.data?.followerIds ?? [];
  const followingSet = useMemo(() => new Set(followingIds), [followingIds]);

  const members = useMemo(() => {
    return (snapshotQuery.data?.members ?? []).map((member) => ({
      ...member,
      isFollowing: followingSet.has(member.id),
    }));
  }, [snapshotQuery.data?.members, followingSet]);

  const visibleMembers = useMemo(
    () =>
      filterCommunityMembers(members, {
        view,
        search: searchQuery,
        selfId,
      }),
    [members, view, searchQuery, selfId],
  );

  const selectedMember = useMemo(
    () => members.find((member) => member.id === selectedMemberId) ?? null,
    [members, selectedMemberId],
  );

  const setView = useCallback(
    (next: CommunityView) => {
      const params = new URLSearchParams(searchParams.toString());

      if (next === "todos") {
        params.delete("view");
      } else {
        params.set("view", next);
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const onSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const onClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const onOpenMember = useCallback((memberId: string) => {
    setSelectedMemberId(memberId);
  }, []);

  const onCloseMember = useCallback(() => {
    setSelectedMemberId(null);
  }, []);

  const onToggleFollow = useCallback(
    (memberId: string) => {
      const member = members.find((item) => item.id === memberId);
      if (!member) {
        return;
      }
      enqueueFollowToggle(memberId, !member.isFollowing);
    },
    [enqueueFollowToggle, members],
  );

  const onRetry = useCallback(() => {
    void snapshotQuery.refetch();
  }, [snapshotQuery]);

  const onOpenMemberProfile = useCallback(
    (memberId: string) => {
      router.push(getMemberProfilePath(memberId));
    },
    [router],
  );

  return {
    view,
    setView,
    searchQuery,
    onSearchChange,
    onClearSearch,
    followingCount: followingIds.length,
    followerCount: followerIds.length,
    members: visibleMembers,
    isLoading: snapshotQuery.isLoading,
    isError: snapshotQuery.isError,
    isEmpty: visibleMembers.length === 0,
    onRetry,
    selectedMember,
    onOpenMember,
    onCloseMember,
    onToggleFollow,
    pendingUserId,
    isTogglePending,
    onOpenMemberProfile,
  };
}
