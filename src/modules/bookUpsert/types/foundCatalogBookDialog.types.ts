import type { BookCatalogMatchResult } from "./bookDiscovery.types";

export type FoundCatalogBookDialogProps = {
  open: boolean;
  matchedBook: BookCatalogMatchResult | null;
  /** Enquanto o vínculo com o livro do catálogo é processado. */
  isLinkingToExisting?: boolean;
  onAddExisting: () => void;
  onIgnoreAndCreate: () => void;
  onCancel: () => void;
};
