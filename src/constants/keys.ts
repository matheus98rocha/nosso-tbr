import { FiltersOptions } from "@/types/filters";

export const QUERY_KEYS = {
  books: {
    all: ["books"] as const,
    list: (filters: FiltersOptions, search: string, page: number) =>
      [...QUERY_KEYS.books.all, filters, search, page] as const,
    myBooks: (
      filters: FiltersOptions,
      search: string,
      userId: string | undefined,
      page: number,
    ) =>
      [
        ...QUERY_KEYS.books.all,
        "my-books",
        filters,
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
      [...QUERY_KEYS.authors.all, page, search] as const,
  },
  stats: {
    all: ["statistics"] as const,
    byReader: (reader: string) =>
      [...QUERY_KEYS.stats.all, "reader", reader] as const,
    collaboration: (reader: string) =>
      [...QUERY_KEYS.stats.all, "collaboration", reader] as const,
  },
};

export const INITIAL_FILTERS: FiltersOptions = {
  readers: [],
  status: [],
  gender: [],
  userId: "",
  bookId: "",
  authorId: "",
};
