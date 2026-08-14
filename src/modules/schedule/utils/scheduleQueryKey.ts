export function getScheduleQueryKey(
  bookId: string,
  userId: string | undefined,
) {
  return ["schedule", bookId, userId] as const;
}

export function getScheduleBookQueryFilterKey(bookId: string) {
  return ["schedule", bookId] as const;
}
