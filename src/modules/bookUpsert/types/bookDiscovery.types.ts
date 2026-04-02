import { BookCreateValidator, Status } from "@/types/books.types";

export type BookCatalogCandidate = {
  id: string;
  title: string;
  authorName: string;
  authorId: string;
  imageUrl: string | null;
  /** Páginas do livro no catálogo, quando disponível. */
  pages: number | null;
  readers: string[];
  chosenBy: string | null;
  /** Nome exibido do usuário em `chosenBy`, resolvido na busca do catálogo. */
  chosenByDisplayName: string | null;
  status: Status | null;
};

export type BookCatalogMatchKind = "exact" | "approximate";

export type BookCatalogMatchResult = {
  candidate: BookCatalogCandidate;
  kind: BookCatalogMatchKind;
  /** `true` se o usuário já participa: é `chosen_by` ou está em `readers`. Bloqueia novo cadastro. */
  userAlreadyLinked: boolean;
  /** `true` quando vale o modal de sugerir entrar na leitura (regras RN49). */
  suggestJoinEligible: boolean;
};

export type PreCreationValidationDecision =
  | { type: "create_new" }
  | { type: "block_duplicate"; match: BookCatalogMatchResult }
  | { type: "suggest_existing"; match: BookCatalogMatchResult };

export type PendingCreationPayload = BookCreateValidator | null;
