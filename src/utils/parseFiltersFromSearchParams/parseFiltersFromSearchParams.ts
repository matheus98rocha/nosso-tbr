import { FiltersOptions, SortOption } from "@/types/filters";

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
  const rawYear = searchParams.get("year");
  const year = rawYear ? parseInt(rawYear, 10) : undefined;
  const myBooks = searchParams.get("myBooks") === "true";
  const isReread =
    searchParams.get("isReread") === "true" ? true : undefined;
  const viewParam = searchParams.get("view");
  let view: FiltersOptions["view"] = "todos";
  if (viewParam === "joint") view = "joint";
  else if (viewParam === "seguindo") view = "seguindo";
  const rawSort = searchParams.get("sort");
  const sort: SortOption | undefined =
    rawSort === "pages_asc" || rawSort === "pages_desc" ? rawSort : undefined;
  const focusReaderId = searchParams.get("reader") ?? "";

  return {
    filters: {
      readers,
      status,
      gender,
      userId,
      bookId,
      authorId,
      year,
      myBooks,
      isReread,
      view,
      sort,
      focusReaderId,
    },
    searchQuery,
  };
}
