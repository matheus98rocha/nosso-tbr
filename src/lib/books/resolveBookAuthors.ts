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

  if (fromJunction.length > 0) {
    const authorIds = fromJunction.map((row) => row.id);
    const authorNames = fromJunction
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

  const legacyId = input.author_id?.trim() || undefined;
  const legacyName = input.author?.name?.trim() || "";

  return {
    authorIds: legacyId ? [legacyId] : [],
    authorNames: legacyName ? [legacyName] : [],
    authorDisplay: legacyName || "Autor desconhecido",
    primaryAuthorId: legacyId,
  };
}
