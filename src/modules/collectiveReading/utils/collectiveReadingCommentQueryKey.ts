export function getCollectiveReadingCommentsQueryKey(bookId: string) {
  return ["collective-reading-comments", bookId] as const;
}

export function getCollectiveReadingGateQueryKey(bookId: string, userId: string) {
  return ["collective-reading-gate", "v2-participants", bookId, userId] as const;
}
