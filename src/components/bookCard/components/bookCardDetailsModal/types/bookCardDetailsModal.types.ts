import type { BookDomain } from "@/types/books.types";

import type { StatusDisplay } from "../../../types/bookCard.types";

export type BookCardDetailsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: BookDomain;
  statusDisplay: StatusDisplay;
  isLogged: boolean;
  isOwnSoloBook: boolean;
  canAccessCollectiveReading: boolean;
  scheduleDisabled: boolean;
  quotesDisabled: boolean;
  onAuthorSearch: () => void;
  onCollectiveReading: () => void;
  onOpenSchedule: () => void;
  onOpenQuotes: () => void;
};
