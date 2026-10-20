import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/constants/keys";
import { useClientMounted } from "@/modules/profile/hooks/useClientMounted";
import { ProfileReadingService } from "@/modules/profile/services";
import { useIsLoggedIn } from "@/stores/hooks/useAuth";

const service = new ProfileReadingService();

export function useProfileReadingShowcase(readerId: string) {
  const isClientReady = useClientMounted();
  const isLoggedIn = useIsLoggedIn();

  return useQuery({
    queryKey: QUERY_KEYS.profile.readingShowcase(readerId),
    queryFn: () => service.getReadingShowcase(readerId),
    enabled: isClientReady && isLoggedIn && Boolean(readerId),
    staleTime: 1000 * 60 * 2,
  });
}
