export const READER_CANDIDATE_MIN_LENGTH = 2;
export const READER_CANDIDATE_LIMIT = 8;

export type ReaderDirectoryRow = {
  id: string;
  display_name: string | null;
  email: string | null;
};

export type ReaderCandidate = {
  id: string;
  displayName: string;
  email: string;
};

export function normalizeReaderSearchTerm(raw: string): string {
  return raw.trim();
}

export function canSearchReaderCandidates(term: string): boolean {
  return normalizeReaderSearchTerm(term).length >= READER_CANDIDATE_MIN_LENGTH;
}

export function excludeCurrentReaders(
  followingIds: readonly string[],
  readerIds: readonly string[],
  selfId: string,
): string[] {
  const blocked = new Set(
    [...readerIds, selfId].map((id) => id.trim()).filter(Boolean),
  );

  const allowed: string[] = [];
  const seen = new Set<string>();

  for (const id of followingIds) {
    const normalized = id.trim();
    if (!normalized || blocked.has(normalized) || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    allowed.push(normalized);
  }

  return allowed;
}

export function toReaderSearchPattern(term: string): string | null {
  if (!canSearchReaderCandidates(term)) {
    return null;
  }

  const escaped = normalizeReaderSearchTerm(term).replace(/[%_\\]/g, "\\$&");

  return `%${escaped}%`;
}

export function toReaderCandidateOrFilter(pattern: string): string {
  const safe = pattern.replace(/["(),]/g, "");

  return `display_name.ilike."${safe}",email.ilike."${safe}"`;
}

export function matchesReaderCandidate(
  row: Pick<ReaderDirectoryRow, "display_name" | "email">,
  term: string,
): boolean {
  const needle = normalizeReaderSearchTerm(term).toLocaleLowerCase("pt-BR");

  if (needle.length < READER_CANDIDATE_MIN_LENGTH) {
    return false;
  }

  const name = (row.display_name ?? "").toLocaleLowerCase("pt-BR");
  const email = (row.email ?? "").toLocaleLowerCase("pt-BR");

  return name.includes(needle) || email.includes(needle);
}

export function toReaderCandidates(
  rows: readonly ReaderDirectoryRow[],
  allowedIds: ReadonlySet<string>,
  readerIds: ReadonlySet<string>,
  term: string,
): ReaderCandidate[] {
  return rows
    .filter(
      (row) =>
        allowedIds.has(row.id) &&
        !readerIds.has(row.id) &&
        matchesReaderCandidate(row, term),
    )
    .slice(0, READER_CANDIDATE_LIMIT)
    .map((row) => ({
      id: row.id,
      displayName: row.display_name?.trim() || "Leitor",
      email: row.email?.trim() ?? "",
    }));
}
