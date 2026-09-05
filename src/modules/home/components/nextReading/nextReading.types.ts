import type { BookDomain } from "@/types/books.types";

export type NextReadingDateMeta = {
  daysUntilStart: number | null;
  isStartOverdue: boolean;
  isToday: boolean;
  relativeLabel: string;
  formattedStartDate: string;
};

export type NextReadingItem = {
  book: BookDomain & { id: string };
  dateMeta: NextReadingDateMeta;
};

export type NextReadingProps = {
  className?: string;
  onEditBook?: (book: BookDomain) => void;
};

export type NextReadingCardProps = {
  item: NextReadingItem;
  onOpenDetails: () => void;
  onRequestStartReading: () => void;
  isStatusPending: boolean;
  onEditBook?: () => void;
};

export type NextReadingStartConfirmationDialogProps = {
  bookTitle: string | null;
  open: boolean;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export type NextReadingBookDetailsModalProps = {
  book: BookDomain & { id: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartReading: () => void;
  isStatusPending: boolean;
};
