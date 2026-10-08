import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { QUERY_KEYS } from "@/constants/keys";

import { CommunityService } from "../services/community.service";
import { COMMUNITY_SUGGESTION_MIN_LENGTH } from "../utils/communityDirectoryQuery";

const SUGGESTION_DEBOUNCE_MS = 300;

export function useCommunityReaderSuggestions(selfId: string, term: string) {
  const [debouncedTerm, setDebouncedTerm] = useState(term);
  const communityService = useMemo(() => new CommunityService(), []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedTerm(term);
    }, SUGGESTION_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [term]);

  const normalizedTerm = debouncedTerm.trim();
  const shouldSearch = normalizedTerm.length >= COMMUNITY_SUGGESTION_MIN_LENGTH;

  const query = useQuery({
    queryKey: QUERY_KEYS.community.suggestions(selfId, normalizedTerm),
    queryFn: () => communityService.searchSuggestions(selfId, normalizedTerm),
    enabled: Boolean(selfId) && shouldSearch,
    staleTime: 1000 * 60,
  });

  return useMemo(
    () => ({
      suggestions: query.data ?? [],
      isLoadingSuggestions: shouldSearch && query.isFetching,
      shouldSearchSuggestions: shouldSearch,
    }),
    [query.data, query.isFetching, shouldSearch],
  );
}
