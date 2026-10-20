"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";

import { QUERY_KEYS } from "@/constants/keys";
import { useOptimisticFollowToggle } from "@/modules/profile/hooks/useOptimisticFollowToggle";
import { UserSocialService } from "@/services/userSocial/userSocial.service";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";
import { useUserStore } from "@/stores/userStore";

import { PopularReadersService } from "../services/popularReaders.service";
import type {
  PopularReader,
  PopularReadersViewModel,
} from "../types/popularReaders.types";
import { POPULAR_READERS_LIMIT } from "../types/popularReaders.types";
import { excludeFollowedReaders } from "../utils/mapPopularReader";
import usePopularReadersPreference from "./usePopularReadersPreference";

const popularReadersService = new PopularReadersService();
const userSocialService = new UserSocialService();

const FOLLOW_ERROR_MESSAGE =
  "Não foi possível atualizar o seguir. Tente de novo.";

export default function usePopularReaders(): PopularReadersViewModel {
  const user = useUserStore((state) => state.user);
  const isLoggedIn = useIsLoggedIn();
  const queryClient = useQueryClient();
  const selfId = user?.id ?? "";
  const preference = usePopularReadersPreference(selfId || undefined);

  const queryEnabled =
    preference.isReady &&
    isLoggedIn &&
    Boolean(selfId) &&
    !preference.hidden;

  const handleToggleError = useCallback(() => {
    toast.error(FOLLOW_ERROR_MESSAGE);
  }, []);

  const {
    toggleFollow,
    isTogglePending,
    pendingUserId,
  } = useOptimisticFollowToggle(selfId || undefined, {
    onToggleError: handleToggleError,
  });

  const listQuery = useQuery({
    queryKey: QUERY_KEYS.popularReaders.list(selfId),
    queryFn: () => popularReadersService.list(POPULAR_READERS_LIMIT),
    enabled: queryEnabled,
    staleTime: 1000 * 60 * 2,
  });

  const followingQuery = useQuery({
    queryKey: ["userSocial", "following", selfId] as const,
    queryFn: () => userSocialService.getFollowingIds(),
    enabled: queryEnabled,
    staleTime: 1000 * 60 * 2,
  });

  const readers = useMemo(() => {
    const followingIds = followingQuery.data ?? [];
    return excludeFollowedReaders(listQuery.data ?? [], followingIds);
  }, [followingQuery.data, listQuery.data]);

  const follow = useCallback(
    (readerId: string) => {
      if (!selfId || readerId === selfId) {
        return;
      }

      queryClient.setQueryData<PopularReader[]>(
        QUERY_KEYS.popularReaders.list(selfId),
        (current) => (current ?? []).filter((reader) => reader.id !== readerId),
      );
      toggleFollow(readerId, true);
    },
    [queryClient, selfId, toggleFollow],
  );

  const isLoading = queryEnabled && listQuery.isLoading;
  const isError = queryEnabled && listQuery.isError;
  const shouldRender =
    isLoggedIn &&
    preference.isReady &&
    !preference.hidden &&
    (isLoading || readers.length > 0);

  return useMemo(
    () => ({
      readers,
      isLoading,
      isError,
      isHidden: preference.hidden,
      shouldRender,
      isTogglePending,
      pendingUserId,
      hide: preference.hide,
      show: preference.show,
      follow,
    }),
    [
      follow,
      isError,
      isLoading,
      isTogglePending,
      pendingUserId,
      preference.hidden,
      preference.hide,
      preference.show,
      readers,
      shouldRender,
    ],
  );
}
