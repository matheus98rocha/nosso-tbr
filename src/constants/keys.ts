// constants/keys.ts
import { FiltersOptions } from "@/types/filters";

export const INITIAL_FILTERS: FiltersOptions = {
  readers: [],
  status: [],
  gender: [],
  view: "todos",
  userId: "",
  bookId: "",
  authorId: "",
  year: undefined,
  myBooks: false,
};

/**
 * Ordena as chaves de um objeto de forma determinística.
 * Útil para garantir que a Query Key do React Query seja idêntica
 * mesmo que as propriedades do objeto de filtros mudem de ordem no estado.
 */
function sortObjectKeys<T extends Record<string, unknown>>(obj: T): T {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return obj;
  }

  const sortedKeys = Object.keys(obj).sort() as Array<keyof T>;

  return sortedKeys.reduce((acc, key) => {
    acc[key] = obj[key];
    return acc;
  }, {} as T);
}

export const QUERY_KEYS = {
  books: {
    all: ["books"] as const,
    list: (
      filters: FiltersOptions,
      search: string,
      page: number,
      userId?: string,
    ) =>
      [
        ...QUERY_KEYS.books.all,
        "list",
        sortObjectKeys({
          ...filters,
          readers: [...filters.readers].sort(),
          status: [...filters.status].sort(),
          gender: [...filters.gender].sort(),
        }),
        search,
        page,
        userId,
      ] as const,
  },
  shelves: {
    all: ["bookshelves"] as const,
  },
  authors: {
    all: ["authors"] as const,
    list: (page: number, search: string) =>
      [...QUERY_KEYS.authors.all, "list", page, search] as const,
  },
  stats: {
    all: ["statistics"] as const,
    byReader: (reader: string) =>
      [...QUERY_KEYS.stats.all, "reader", reader] as const,
    collaboration: (reader: string) =>
      [...QUERY_KEYS.stats.all, "collaboration", reader] as const,
    leaderboard: (year: number | "all") =>
      [...QUERY_KEYS.stats.all, "leaderboard", year] as const,
  },
  search: {
    all: ["search"] as const,
    autocomplete: (term: string) =>
      [...QUERY_KEYS.search.all, "autocomplete", term] as const,
  },
} as const;
