import type { BookDomain } from "@/types/books.types";

export class ShelfBookOrderError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "LENGTH_MISMATCH"
      | "DUPLICATE_SOURCE"
      | "DUPLICATE_TARGET"
      | "UNKNOWN_ID"
      | "MISSING_ID",
  ) {
    super(message);
    this.name = "ShelfBookOrderError";
  }
}

export function validateShelfReorderPayload(
  shelfBookIds: readonly string[],
  nextOrder: readonly string[],
): void {
  if (shelfBookIds.length !== nextOrder.length) {
    throw new ShelfBookOrderError(
      "A nova ordem deve conter exatamente os mesmos livros da estante.",
      "LENGTH_MISMATCH",
    );
  }
  const prevSet = new Set(shelfBookIds);
  if (prevSet.size !== shelfBookIds.length) {
    throw new ShelfBookOrderError(
      "Lista de origem com identificadores duplicados.",
      "DUPLICATE_SOURCE",
    );
  }
  const nextSet = new Set(nextOrder);
  if (nextSet.size !== nextOrder.length) {
    throw new ShelfBookOrderError(
      "A nova ordem não pode repetir o mesmo livro.",
      "DUPLICATE_TARGET",
    );
  }
  for (const id of nextOrder) {
    if (!prevSet.has(id)) {
      throw new ShelfBookOrderError(
        "Ordem contém livro que não está na estante.",
        "UNKNOWN_ID",
      );
    }
  }
  for (const id of shelfBookIds) {
    if (!nextSet.has(id)) {
      throw new ShelfBookOrderError(
        "Ordem incompleta: falta livro que estava na estante.",
        "MISSING_ID",
      );
    }
  }
}

export function reorderBooksByIdOrder(
  books: readonly BookDomain[],
  orderedIds: readonly string[],
): BookDomain[] {
  const map = new Map(
    books
      .filter((b): b is BookDomain & { id: string } => Boolean(b.id))
      .map((b) => [b.id, b]),
  );
  return orderedIds
    .map((id) => map.get(id))
    .filter((b): b is BookDomain => b !== undefined);
}
