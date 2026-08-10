"use client";

import { Button } from "@/components/ui/button";
import FinishedReadingRatingDialog from "@/modules/bookRating/components/finishedReadingRatingDialog";
import { useCardReadingRatingEntry } from "@/modules/bookRating/hooks/useCardReadingRatingEntry";

import type { BookDomain } from "@/types/books.types";

type CardReadingRatingButtonProps = {
  book: BookDomain;
};

export default function CardReadingRatingButton(props: CardReadingRatingButtonProps) {
  const { book } = props;
  const entry = useCardReadingRatingEntry(book);

  if (!entry.show || !entry.bookId) {
    return null;
  }

  return (
    <>
      <div className="flex min-w-0 w-full flex-col border-t border-zinc-200/80 pt-2.5 dark:border-zinc-800/80">
        <Button
          type="button"
          variant="outline"
          className="w-full cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            entry.openDialog();
          }}
        >
          {entry.value === null ? "Adicionar avaliação" : "Alterar avaliação"}
        </Button>
      </div>
      <FinishedReadingRatingDialog
        bookId={entry.bookId}
        open={entry.dialogOpen}
        onDismiss={entry.closeDialog}
        initialStars={entry.value}
      />
    </>
  );
}
