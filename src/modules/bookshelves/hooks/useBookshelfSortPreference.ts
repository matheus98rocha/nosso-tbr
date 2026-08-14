import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { SortOption } from "@/types/filters";

const SORT_QUERY_KEY = "sort";

export function parseBookshelfUrlSort(
  raw: string | null,
): SortOption | undefined {
  if (!raw) return undefined;
  if (
    raw === "pages_asc" ||
    raw === "pages_desc" ||
    raw === "start_date_asc" ||
    raw === "start_date_desc" ||
    raw === "end_date_asc" ||
    raw === "end_date_desc"
  ) {
    return raw;
  }
  return undefined;
}

export function useBookshelfSortPreference() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const sort = useMemo(
    () => parseBookshelfUrlSort(searchParams.get(SORT_QUERY_KEY)),
    [searchParams],
  );

  const handleSetSort = useCallback(
    (value: SortOption | undefined) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value) next.set(SORT_QUERY_KEY, value);
      else next.delete(SORT_QUERY_KEY);
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return { sort, handleSetSort };
}
