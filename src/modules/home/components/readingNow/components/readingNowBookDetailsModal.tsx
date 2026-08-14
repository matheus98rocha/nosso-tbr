"use client";

import BookCardDetailsModal from "@/components/bookCard/components/bookCardDetailsModal";
import { useBookCard } from "@/components/bookCard/hooks/useBookCard";

import type { ReadingNowBookDetailsModalProps } from "../readingNow.types";

export default function ReadingNowBookDetailsModal({
  book,
  open,
  onOpenChange,
  onFinishReading,
  onPauseReading,
  onAbandonReading,
  isStatusPending,
}: ReadingNowBookDetailsModalProps) {
  const {
    statusDisplay,
    isLogged,
    isOwnSoloBook,
    canAccessCollectiveReading,
    handleAuthorSearchFromDetails,
    handleCollectiveReadingFromDetails,
    handleScheduleFromDetails,
    handleQuotesFromDetails,
  } = useBookCard({ book, isShelf: false });

  return (
    <BookCardDetailsModal
      open={open}
      onOpenChange={onOpenChange}
      book={book}
      statusDisplay={statusDisplay}
      isLogged={isLogged}
      isOwnSoloBook={isOwnSoloBook}
      canAccessCollectiveReading={canAccessCollectiveReading}
      scheduleDisabled={book.status === "finished"}
      quotesDisabled={book.status === "not_started"}
      onAuthorSearch={handleAuthorSearchFromDetails}
      onCollectiveReading={handleCollectiveReadingFromDetails}
      onOpenSchedule={handleScheduleFromDetails}
      onOpenQuotes={handleQuotesFromDetails}
      onFinishReading={onFinishReading}
      onPauseReading={onPauseReading}
      onAbandonReading={onAbandonReading}
      isStatusPending={isStatusPending}
    />
  );
}
