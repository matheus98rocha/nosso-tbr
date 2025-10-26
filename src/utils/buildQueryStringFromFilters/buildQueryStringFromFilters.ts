import { FiltersOptions } from "@/types/filters";

export function buildQueryStringFromFilters(
  newFilters: FiltersOptions,
  search?: string,
  bookId?: string
) {
  const params = new URLSearchParams();

  if (search && search.trim()) params.set("search", search.trim());

  if (Array.isArray(newFilters.readers) && newFilters.readers.length) {
    params.set("readers", newFilters.readers.map(encodeURIComponent).join(","));
  }

  if (Array.isArray(newFilters.status) && newFilters.status.length) {
    params.set("status", newFilters.status.map(encodeURIComponent).join(","));
  }

  if (Array.isArray(newFilters.gender) && newFilters.gender.length) {
    params.set("gender", newFilters.gender.map(encodeURIComponent).join(","));
  }

  const idToSet = bookId ?? newFilters.bookId;
  if (idToSet) params.set("bookId", idToSet);

  return params.toString();
}
