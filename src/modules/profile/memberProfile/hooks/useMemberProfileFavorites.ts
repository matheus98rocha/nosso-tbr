import { useQuery } from "@tanstack/react-query";

import { useClientMounted } from "@/modules/profile/hooks/useClientMounted";
import { BookFavoritesService } from "@/services/bookFavorites/bookFavorites.service";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";

const service = new BookFavoritesService();

export function useMemberProfileFavorites(profileUserId: string) {
  const isClientReady = useClientMounted();
  const isLoggedIn = useIsLoggedIn();

  return useQuery({
    queryKey: ["userSocial", "profileFavoriteBooks", profileUserId],
    queryFn: () => service.getFavoriteBooksForUser(profileUserId),
    enabled: isClientReady && isLoggedIn && !!profileUserId,
    staleTime: 1000 * 60 * 2,
  });
}
