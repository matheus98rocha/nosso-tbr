import { useCallback, useMemo, useState } from "react";

import { useReadingRatingStrip } from "@/modules/bookRating/hooks/useReadingRatingStrip";

import type { BookDomain } from "@/types/books.types";

export function useCardReadingRatingEntry(book: BookDomain) {
  const strip = useReadingRatingStrip({ book });
  const [dialogOpen, setDialogOpen] = useState(false);
  const bookId = book.id ?? null;

  const openDialog = useCallback(() => {
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  return useMemo(
    () => ({
      show: strip.show,
      value: strip.value,
      dialogOpen,
      openDialog,
      closeDialog,
      bookId,
    }),
    [
      strip.show,
      strip.value,
      dialogOpen,
      openDialog,
      closeDialog,
      bookId,
    ],
  );
}
