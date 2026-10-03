import type { BookDomain } from "@/types/books.types";

import type { StatusDisplay } from "../../../types/bookCard.types";

export type BookDetailsActionIcon =
  | "calendar"
  | "quotes"
  | "search"
  | "collective"
  | "copy"
  | "share"
  | "shelf"
  | "edit"
  | "favorite"
  | "pause"
  | "abandon"
  | "play"
  | "check"
  | "library"
  | "finish"
  | "trash"
  | "reader";

export type BookDetailsInsight = {
  id: string;
  label: string;
  value: string;
  hint: string;
};

export type BookDetailsTimelineItem = {
  id: string;
  label: string;
  value: string;
};

export type BookDetailsCommand = {
  id: string;
  label: string;
  hint: string;
  icon: BookDetailsActionIcon;
  disabled: boolean;
  pressed?: boolean;
  title?: string;
  danger?: boolean;
  onSelect: () => void;
};

export type BookDetailsPrimaryTone = "start" | "finish" | "library";

export type BookDetailsPrimaryAction = {
  label: string;
  icon: BookDetailsActionIcon;
  disabled: boolean;
  tone: BookDetailsPrimaryTone;
  onSelect: () => void;
};

export type BookDetailsCommandButtonProps = {
  command: BookDetailsCommand;
};

export type BookDetailsHeroProps = {
  book: BookDomain;
  statusDisplay: StatusDisplay;
  isOwnSoloBook: boolean;
  ratingStars: number | null;
};

export type BookDetailsInsightsProps = {
  insights: BookDetailsInsight[];
};

export type BookDetailsTimelineProps = {
  items: BookDetailsTimelineItem[];
};

export type BookDetailsReadersProps = {
  readers: string[];
};

export type BookDetailsCommandGridProps = {
  commands: BookDetailsCommand[];
};

export type BookDetailsFooterProps = {
  primary: BookDetailsPrimaryAction | null;
  secondary: BookDetailsCommand[];
};

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
  onStartReading?: () => void;
  onFinishReading?: () => void;
  onPauseReading?: () => void;
  onAbandonReading?: () => void;
  onShare?: () => void;
  onToggleFavorite?: () => void;
  onAddToShelf?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  deleteLabel?: string;
  deleteHint?: string;
  onAddToLibrary?: () => void;
  showFavoriteToggle?: boolean;
  showLibraryActions?: boolean;
  showScheduleProgress?: boolean;
  showAddToLibrary?: boolean;
  isFavoritePending?: boolean;
  isAddToLibraryPending?: boolean;
  isStatusPending?: boolean;
};
