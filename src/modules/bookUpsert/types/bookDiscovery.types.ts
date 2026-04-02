import { BookCreateValidator } from "@/types/books.types";

export type BookCatalogCandidate = {
  id: string;
  title: string;
  authorName: string;
  authorId: string;
  imageUrl: string | null;
  synopsis: string | null;
  publisher: string | null;
  readers: string[];
};

export type BookCatalogMatchKind = "exact" | "approximate";

export type BookCatalogMatchResult = {
  candidate: BookCatalogCandidate;
  kind: BookCatalogMatchKind;
  userAlreadyLinked: boolean;
};

export type PreCreationValidationDecision =
  | { type: "create_new" }
  | { type: "block_duplicate"; match: BookCatalogMatchResult }
  | { type: "suggest_existing"; match: BookCatalogMatchResult };

export type PendingCreationPayload = BookCreateValidator | null;
