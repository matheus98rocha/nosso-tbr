export function bookshelfBooksQueryKey(bookshelfId: string | undefined) {
  return ["bookshelf-books", bookshelfId] as const;
}
