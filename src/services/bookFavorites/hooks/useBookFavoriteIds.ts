import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { QUERY_KEYS } from "@/constants/keys";
import { BookFavoritesService } from "@/services/bookFavorites/bookFavorites.service";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";

const service = new BookFavoritesService();

export function useBookFavoriteIds(userId: string | undefined) {
  const isLoggedIn = useIsLoggedIn();

  const query = useQuery({
    queryKey: userId
      ? QUERY_KEYS.bookFavorites.byUser(userId)
      : ["bookFavorites", "none"],
    queryFn: () => service.listBookIdsForCurrentUser(),
    enabled: isLoggedIn && !!userId,
    staleTime: 1000 * 60 * 2,
  });

  const idSet = useMemo(
    () => new Set(query.data ?? []),
    [query.data],
  );

  return {
    favoriteIdSet: idSet,
    favoriteIds: query.data ?? [],
    isLoading: query.isLoading,
  };
}
