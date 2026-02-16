import { FiltersOptions } from "@/types/filters";

export function parseFiltersFromSearchParams(searchParams: URLSearchParams): {
  filters: FiltersOptions;
  searchQuery: string;
} {
  const readers =
    searchParams
      .get("readers")
      ?.split(",")
      .filter(Boolean)
      .map(decodeURIComponent) ?? [];

  const status =
    searchParams
      .get("status")
      ?.split(",")
      .filter(Boolean)
      .map(decodeURIComponent) ?? [];

  const gender =
    searchParams
      .get("gender")
      ?.split(",")
      .filter(Boolean)
      .map(decodeURIComponent) ?? [];

  const userId = searchParams.get("userId") ?? "";
  const bookId = searchParams.get("bookId") ?? "";
  const searchQuery = searchParams.get("search") ?? "";
  const authorId = searchParams.get("authorId") || "";

  return {
    filters: { readers, status, gender, userId, bookId, authorId },
    searchQuery,
  };
}
