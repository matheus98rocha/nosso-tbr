// services/queryConfigs.ts
import { INITIAL_FILTERS, QUERY_KEYS } from "@/constants/keys";
import { FiltersOptions } from "@/types/filters";

export const DEFAULT_QUERY_CONFIG = {
  staleTime: 1000 * 60 * 5, // 5 minutos
  gcTime: 1000 * 60 * 10, // 10 minutos
  refetchOnMount: false,
  refetchOnWindowFocus: false,
};

export const getMyBooksOptions = (
  filters: FiltersOptions = INITIAL_FILTERS,
  search = "",
  userId?: string,
  page = 0,
) => ({
  queryKey: QUERY_KEYS.books.myBooks(filters, search, userId, page),
  ...DEFAULT_QUERY_CONFIG,
});

export const getAuthorsOptions = (page = 0, search = "") => ({
  queryKey: QUERY_KEYS.authors.list(page, search),
  ...DEFAULT_QUERY_CONFIG,
});
