import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/keys";
import { useClientMounted } from "@/modules/profile/hooks/useClientMounted";
import { UserSocialService } from "@/services/userSocial/userSocial.service";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";

const service = new UserSocialService();

export function useProfileNetworkCounts(userId: string) {
  const isClientReady = useClientMounted();
  const isLoggedIn = useIsLoggedIn();

  return useQuery({
    queryKey: QUERY_KEYS.profile.networkCounts(userId),
    queryFn: () => service.getNetworkCounts(userId),
    enabled: isClientReady && isLoggedIn && Boolean(userId),
    staleTime: 1000 * 60 * 2,
  });
}
