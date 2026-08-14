import type { BookDomain, Status } from "@/types/books.types";
import type { ReadingProgressDomain } from "@/modules/schedule/types/readingProgress.types";

export type ReadingNowBookItem = {
  book: BookDomain & { id: string };
  scheduleProgress: ReadingProgressDomain | null;
  daysReading: number | null;
};

export type ReadingNowProps = {
  className?: string;
};

export type ReadingNowBookSlideProps = {
  item: ReadingNowBookItem;
  onOpenDetails: () => void;
  onNavigateToSchedule: () => void;
  onNavigateToQuotes: () => void;
  onFinishReading: () => void;
  onPauseReading: () => void;
  onAbandonReading: () => void;
  isProgressLoading: boolean;
  isStatusPending: boolean;
};

export type ReadingNowCarouselDotsProps = {
  total: number;
  activeIndex: number;
  onSelect: (index: number) => void;
};

export type ReadingNowBookDetailsModalProps = {
  book: BookDomain & { id: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export type ReadingNowStatusActionsProps = {
  onFinish: () => void;
  onPause: () => void;
  onAbandon: () => void;
  isPending: boolean;
  className?: string;
};

export type ReadingNowStatusTransitionTarget = {
  book: BookDomain & { id: string };
  nextStatus: Status;
};
