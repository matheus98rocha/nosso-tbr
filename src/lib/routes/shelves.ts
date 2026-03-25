export const SHELVES_LIST_PATH = "/shelves" as const;

export function getBookshelfBooksPath(shelfId: string) {
  return `/bookshelves/${shelfId}` as const;
}
