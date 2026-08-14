import type { SortOption } from "@/types/filters";
import type { BookDomain } from "@/types/books.types";

function isoDateTimeMs(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const t = new Date(raw).getTime();
  return Number.isFinite(t) ? t : null;
}

function compareMissingLast(
  ta: number | null,
  tb: number | null,
  asc: boolean,
): number {
  if (ta === null && tb === null) return 0;
  if (ta === null) return 1;
  if (tb === null) return -1;
  return asc ? ta - tb : tb - ta;
}

export function applyBookshelfDisplaySort(
  books: BookDomain[],
  sort: SortOption | undefined,
): BookDomain[] {
  if (!sort) return books;
  if (sort === "pages_asc" || sort === "pages_desc") {
    const asc = sort === "pages_asc";
    return [...books].sort((a, b) => {
      const pa = a.pages ?? 0;
      const pb = b.pages ?? 0;
      return asc ? pa - pb : pb - pa;
    });
  }
  if (sort === "start_date_asc" || sort === "start_date_desc") {
    const asc = sort === "start_date_asc";
    return [...books].sort((a, b) => {
      const ta = isoDateTimeMs(a.start_date);
      const tb = isoDateTimeMs(b.start_date);
      return compareMissingLast(ta, tb, asc);
    });
  }
  const asc = sort === "end_date_asc";
  return [...books].sort((a, b) => {
    const ta = isoDateTimeMs(a.end_date);
    const tb = isoDateTimeMs(b.end_date);
    return compareMissingLast(ta, tb, asc);
  });
}
