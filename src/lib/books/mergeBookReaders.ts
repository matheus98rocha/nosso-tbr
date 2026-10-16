function uniqueIds(ids: readonly string[]): string[] {
  const next: string[] = [];
  const seen = new Set<string>();

  for (const id of ids) {
    const trimmed = id.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    next.push(trimmed);
  }

  return next;
}

export function mergeBookReaders(
  current: readonly string[],
  desired: readonly string[],
  base?: readonly string[] | null,
): string[] {
  const desiredIds = uniqueIds(desired);

  if (!base) {
    return desiredIds;
  }

  const baseIds = uniqueIds(base);
  const baseSet = new Set(baseIds);
  const desiredSet = new Set(desiredIds);
  const removed = new Set(baseIds.filter((id) => !desiredSet.has(id)));
  const next: string[] = [];
  const seen = new Set<string>();

  for (const id of uniqueIds(current)) {
    if (removed.has(id) || seen.has(id)) continue;
    seen.add(id);
    next.push(id);
  }

  for (const id of desiredIds) {
    if (baseSet.has(id) || seen.has(id)) continue;
    seen.add(id);
    next.push(id);
  }

  if (next.length === 0) {
    return desiredIds;
  }

  return next;
}
