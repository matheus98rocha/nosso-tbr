import { formatList } from "@/utils/formatters";

export type BookAuthorJoinRow = {
  author_id?: string | null;
  authors?: { name: string | null } | null;
  author?: { name: string | null } | null;
};

export type ResolveBookAuthorsInput = {
  book_authors?: BookAuthorJoinRow[] | null;
  credited_authors?: BookAuthorJoinRow[] | null;
  author?: { name: string | null } | null;
  author_id?: string | null;
};

export type ResolvedBookAuthors = {
  authorIds: string[];
  authorNames: string[];
  authorDisplay: string;
  primaryAuthorId: string | undefined;
};

function pinStoredPrimaryAuthor<T extends { id: string }>(
  rows: T[],
  primaryAuthorId: string | undefined,
): T[] {
  if (!primaryAuthorId) return rows;
  const index = rows.findIndex((row) => row.id === primaryAuthorId);
  if (index <= 0) return rows;
  return [rows[index], ...rows.slice(0, index), ...rows.slice(index + 1)];
}

export function resolveBookAuthors(
  input: ResolveBookAuthorsInput,
): ResolvedBookAuthors {
  const junctionRows =
    input.credited_authors && input.credited_authors.length > 0
      ? input.credited_authors
      : (input.book_authors ?? []);

  const fromJunction = junctionRows
    .map((row) => {
      const id = row.author_id?.trim() || "";
      const name =
        row.authors?.name?.trim() ||
        row.author?.name?.trim() ||
        "";
      return { id, name };
    })
    .filter((row) => row.id.length > 0);

  const storedPrimaryId = input.author_id?.trim() || undefined;
  const orderedJunction = pinStoredPrimaryAuthor(fromJunction, storedPrimaryId);

  if (orderedJunction.length > 0) {
    const authorIds = orderedJunction.map((row) => row.id);
    const authorNames = orderedJunction
      .map((row) => row.name)
      .filter((name) => name.length > 0);
    return {
      authorIds,
      authorNames,
      authorDisplay:
        authorNames.length > 0
          ? formatList(authorNames)
          : "Autor desconhecido",
      primaryAuthorId: authorIds[0],
    };
  }

  const legacyId = storedPrimaryId;
  const legacyName = input.author?.name?.trim() || "";

  return {
    authorIds: legacyId ? [legacyId] : [],
    authorNames: legacyName ? [legacyName] : [],
    authorDisplay: legacyName || "Autor desconhecido",
    primaryAuthorId: legacyId,
  };
}
