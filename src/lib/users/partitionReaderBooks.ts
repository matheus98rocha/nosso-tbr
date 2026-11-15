export type ReaderBookRow = {
  id: string;
  chosen_by: string | null;
  user_id: string | null;
  readers: string[] | null;
};

export type DetachedReaderBook = {
  id: string;
  chosen_by: string;
  user_id: string | null;
  readers: string[];
};

function isOtherLivingUser(
  id: string | null | undefined,
  userId: string,
  livingUserIds: ReadonlySet<string>,
): id is string {
  return (
    typeof id === "string" &&
    id.length > 0 &&
    id !== userId &&
    livingUserIds.has(id)
  );
}

function survivorIds(
  book: ReaderBookRow,
  userId: string,
  livingUserIds: ReadonlySet<string>,
): string[] {
  const ids = new Set<string>();
  for (const readerId of book.readers ?? []) {
    if (isOtherLivingUser(readerId, userId, livingUserIds)) ids.add(readerId);
  }
  if (isOtherLivingUser(book.chosen_by, userId, livingUserIds)) {
    ids.add(book.chosen_by);
  }
  if (isOtherLivingUser(book.user_id, userId, livingUserIds)) {
    ids.add(book.user_id);
  }
  return [...ids];
}

function livingReaders(
  book: ReaderBookRow,
  userId: string,
  livingUserIds: ReadonlySet<string>,
): string[] {
  const seen = new Set<string>();
  const readers: string[] = [];
  for (const readerId of book.readers ?? []) {
    if (
      !isOtherLivingUser(readerId, userId, livingUserIds) ||
      seen.has(readerId)
    ) {
      continue;
    }
    seen.add(readerId);
    readers.push(readerId);
  }
  return readers;
}

export function partitionReaderBooks(
  books: ReaderBookRow[],
  userId: string,
  livingUserIds: ReadonlySet<string>,
): { deleteIds: string[]; detach: DetachedReaderBook[] } {
  const unique = new Map<string, ReaderBookRow>();
  for (const book of books) {
    if (book.id) unique.set(book.id, book);
  }

  const deleteIds: string[] = [];
  const detach: DetachedReaderBook[] = [];

  for (const book of unique.values()) {
    const survivors = survivorIds(book, userId, livingUserIds);
    if (survivors.length === 0) {
      deleteIds.push(book.id);
      continue;
    }

    detach.push({
      id: book.id,
      chosen_by: isOtherLivingUser(book.chosen_by, userId, livingUserIds)
        ? book.chosen_by
        : survivors[0],
      user_id: isOtherLivingUser(book.user_id, userId, livingUserIds)
        ? book.user_id
        : null,
      readers: livingReaders(book, userId, livingUserIds),
    });
  }

  return { deleteIds, detach };
}
