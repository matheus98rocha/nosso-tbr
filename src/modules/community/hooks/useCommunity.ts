import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  CommunityMemberSuggestion,
  CommunityView,
  CommunityViewModel,
} from "../types/community.types";
import {
  COMMUNITY_PAGE_SIZE,
  parseCommunityPage,
} from "../utils/communityDirectoryQuery";
import { countMutualFollows } from "../utils/communityRelation";
import { parseCommunityView } from "../utils/filterCommunityMembers";
import { useCommunityReaderSuggestions } from "./useCommunityReaderSuggestions";
import { useRemoveFollower } from "./useRemoveFollower";

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

  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [removalMemberId, setRemovalMemberId] = useState<string | null>(null);

  const view = parseCommunityView(searchParams.get("view"));
  const searchQuery = searchParams.get("q") ?? "";
  const currentPage = parseCommunityPage(searchParams.get("page"));
  const selfId = user?.id ?? "";
  const queryEnabled = isClientReady && isLoggedIn && Boolean(selfId);
  const [inputValue, setInputValue] = useState(searchQuery);

  const handleToggleError = useCallback(() => {
    toast.error(FOLLOW_ERROR_MESSAGE);
  }, []);

  const followersQuery = useQuery({
    queryKey: ["userSocial", "followers", selfId] as const,
    queryFn: () => userSocialService.getFollowerIds(),
    enabled: queryEnabled,
    staleTime: 1000 * 60 * 2,
  });

  const pageQuery = useQuery({
    queryKey: QUERY_KEYS.community.page(selfId, view, searchQuery, currentPage),
    queryFn: () =>
      communityService.getMembersPage({
        selfId,
        view,
        search: searchQuery,
        page: currentPage,
        pageSize: COMMUNITY_PAGE_SIZE,
      }),
    enabled: queryEnabled,
    staleTime: 1000 * 30,
  });

  const readerSuggestions = useCommunityReaderSuggestions(selfId, inputValue);

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

  const {
    removeFollower,
    isRemovePending,
    pendingRemovalUserId,
  } = useRemoveFollower(selfId);

  const followingIds = useMemo(
    () => followingQuery.data ?? [],
    [followingQuery.data],
  );

  const followerIds = useMemo(
    () => followersQuery.data ?? [],
    [followersQuery.data],
  );
  const followingSet = useMemo(() => new Set(followingIds), [followingIds]);
  const followerSet = useMemo(() => new Set(followerIds), [followerIds]);
  const mutualCount = useMemo(
    () => countMutualFollows(followingIds, followerIds),
    [followingIds, followerIds],
  );

  const members = useMemo(() => {
    return (pageQuery.data?.members ?? []).map((member) => ({
      ...member,
      isFollowing: followingSet.has(member.id),
      isFollower: followerSet.has(member.id),
    }));
  }, [followerSet, followingSet, pageQuery.data?.members]);

  const totalPages = useMemo(() => {
    const total = pageQuery.data?.total ?? 0;

    if (total === 0) {
      return 0;
    }

    return Math.ceil(total / COMMUNITY_PAGE_SIZE);
  }, [pageQuery.data?.total]);

  const selectedMember = useMemo(
    () => members.find((member) => member.id === selectedMemberId) ?? null,
    [members, selectedMemberId],
  );

  const removalMember = useMemo(
    () => members.find((member) => member.id === removalMemberId) ?? null,
    [members, removalMemberId],
  );

  const replaceCommunityParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const setView = useCallback(
    (next: CommunityView) => {
      replaceCommunityParams((params) => {
        if (next === "todos") {
          params.delete("view");
        } else {
          params.set("view", next);
        }

        params.delete("page");
      });
    },
    [replaceCommunityParams],
  );

  const onSearchInputChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  const onSubmitSearch = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      setInputValue(trimmed);
      replaceCommunityParams((params) => {
        if (trimmed) {
          params.set("q", trimmed);
        } else {
          params.delete("q");
        }

        params.delete("page");
      });
    },
    [replaceCommunityParams],
  );

  const onSelectSuggestion = useCallback(
    (suggestion: CommunityMemberSuggestion) => {
      onSubmitSearch(suggestion.displayName);
    },
    [onSubmitSearch],
  );

  const onClearSearch = useCallback(() => {
    setInputValue("");
    replaceCommunityParams((params) => {
      params.delete("q");
      params.delete("page");
    });
  }, [replaceCommunityParams]);

  const onPageChange = useCallback(
    (page: number | ((currentPage: number) => number)) => {
      const nextPage = typeof page === "function" ? page(currentPage) : page;

      replaceCommunityParams((params) => {
        if (nextPage <= 0) {
          params.delete("page");
          return;
        }

        params.set("page", String(nextPage));
      });
    },
    [currentPage, replaceCommunityParams],
  );

  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

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

  const onRequestRemoveFollower = useCallback(
    (memberId: string) => {
      const member = members.find((item) => item.id === memberId);
      if (!member?.isFollower || memberId === selfId) {
        return;
      }

      setSelectedMemberId(null);
      setRemovalMemberId(memberId);
    },
    [members, selfId],
  );

  const onCancelRemoveFollower = useCallback(() => {
    if (isRemovePending) {
      return;
    }

    setRemovalMemberId(null);
  }, [isRemovePending]);

  const onConfirmRemoveFollower = useCallback(() => {
    if (!removalMemberId) {
      return;
    }

    removeFollower(removalMemberId, {
      onSuccess: () => setRemovalMemberId(null),
    });
  }, [removalMemberId, removeFollower]);

  const onRetry = useCallback(() => {
    void pageQuery.refetch();
  }, [pageQuery]);

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
    inputValue,
    onSearchInputChange,
    onSubmitSearch,
    onSelectSuggestion,
    suggestions: readerSuggestions.suggestions,
    isLoadingSuggestions: readerSuggestions.isLoadingSuggestions,
    shouldSearchSuggestions: readerSuggestions.shouldSearchSuggestions,
    onClearSearch,
    currentPage,
    totalPages,
    onPageChange,
    followingCount: followingIds.length,
    followerCount: followerIds.length,
    mutualCount,
    members,
    isLoading: pageQuery.isLoading,
    isError: pageQuery.isError,
    isEmpty: !pageQuery.isLoading && members.length === 0,
    onRetry,
    selectedMember,
    onOpenMember,
    onCloseMember,
    onToggleFollow,
    pendingUserId,
    isTogglePending,
    onOpenMemberProfile,
    removalMember,
    onRequestRemoveFollower,
    onCancelRemoveFollower,
    onConfirmRemoveFollower,
    isRemovePending,
    pendingRemovalUserId,
  };
}
