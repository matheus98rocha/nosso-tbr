export function addedReaderIds(
  currentReaders: readonly string[] | null | undefined,
  nextReaders: readonly string[],
  actorId: string,
): string[] {
  const current = new Set<string>();

  for (const readerId of currentReaders ?? []) {
    const trimmed = readerId.trim();
    if (trimmed) current.add(trimmed);
  }

  const added: string[] = [];
  const seen = new Set<string>();

  for (const readerId of nextReaders) {
    const trimmed = readerId.trim();
    if (
      !trimmed ||
      trimmed === actorId ||
      current.has(trimmed) ||
      seen.has(trimmed)
    ) {
      continue;
    }
    seen.add(trimmed);
    added.push(trimmed);
  }

  return added;
}
