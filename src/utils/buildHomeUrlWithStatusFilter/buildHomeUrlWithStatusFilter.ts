import { Status } from "@/types/books.types";
import { buildQueryStringFromFilters } from "@/utils/buildQueryStringFromFilters";
import { parseFiltersFromSearchParams } from "@/utils/parseFiltersFromSearchParams";

export function buildHomeUrlWithStatusFilter(
  searchParams: URLSearchParams,
  newStatus: Status,
): string {
  const { filters, searchQuery } = parseFiltersFromSearchParams(searchParams);
  const qs = buildQueryStringFromFilters(
    { ...filters, status: [newStatus], bookId: "" },
    searchQuery,
  );

  return qs ? `/?${qs}` : "/";
}
