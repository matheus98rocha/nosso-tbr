// constants/keys.ts
import { FiltersOptions } from "@/types/filters";

export const INITIAL_FILTERS: FiltersOptions = {
  readers: [],
  status: [],
  gender: [],
  userId: "",
  bookId: "",
  authorId: "",
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
    list: (filters: FiltersOptions, search: string, page: number) =>
      [
        ...QUERY_KEYS.books.all,
        "list",
        sortObjectKeys(filters),
        search,
        page,
      ] as const,
    myBooks: (
      filters: FiltersOptions,
      search: string,
      userId: string | undefined,
      page: number,
    ) =>
      [
        ...QUERY_KEYS.books.all,
        "my-books",
        sortObjectKeys(filters),
        search,
        userId,
        page,
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
  },
} as const;
