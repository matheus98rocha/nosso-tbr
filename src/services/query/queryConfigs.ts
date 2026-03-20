// services/queryConfigs.ts
import { QUERY_KEYS } from "@/constants/keys";

export const DEFAULT_QUERY_CONFIG = {
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 10,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
};

export const getAuthorsOptions = (page = 0, search = "") => ({
  queryKey: QUERY_KEYS.authors.list(page, search),
  ...DEFAULT_QUERY_CONFIG,
});
