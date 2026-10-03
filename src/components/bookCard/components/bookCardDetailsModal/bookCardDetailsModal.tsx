"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CardReadingRatingButton } from "@/modules/bookRating";
import { CardReadingProgressIndicator } from "@/modules/schedule/components/readingProgressIndicator";

import {
  BookDetailsCommandGrid,
  BookDetailsFooter,
  BookDetailsHero,
  BookDetailsInsights,
  BookDetailsReaders,
  BookDetailsTimeline,
} from "./components/bookDetailsSections";
import { useBookCardDetailsModal } from "./hooks";

import type { BookCardDetailsModalProps } from "./types/bookCardDetailsModal.types";

export default function BookCardDetailsModal(props: BookCardDetailsModalProps) {
  const { open, onOpenChange, book, statusDisplay, isOwnSoloBook, isLogged } =
    props;
  const {
    abandonConfirmationOpen,
    setAbandonConfirmationOpen,
    confirmAbandon,
    insights,
    timeline,
    readers,
    ratingStars,
    primary,
    secondary,
    commands,
  } = useBookCardDetailsModal(props);

  const showSchedule =
    open && props.showScheduleProgress && Boolean(book.id);
  const showRating = open && isLogged && book.status === "finished";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton
          className="flex max-h-[min(88vh,calc(100dvh-1.5rem))] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[34rem]"
        >
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <BookDetailsHero
                book={book}
                statusDisplay={statusDisplay}
                isOwnSoloBook={isOwnSoloBook}
                ratingStars={ratingStars}
              />

              <div className="flex flex-col gap-5 px-5 py-5">
                <BookDetailsInsights insights={insights} />
                <BookDetailsTimeline items={timeline} />
                <BookDetailsReaders readers={readers} />
                {showSchedule ? (
                  <section
                    aria-label="Andamento do cronograma"
                    className="flex flex-col gap-2"
                  >
                    <h3 className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                      Andamento
                    </h3>
                    <CardReadingProgressIndicator
                      bookId={book.id}
                      onNavigateToSchedule={props.onOpenSchedule}
                    />
                  </section>
                ) : null}
                {showRating ? <CardReadingRatingButton book={book} /> : null}
                <BookDetailsCommandGrid commands={commands} />
              </div>
            </div>

            <BookDetailsFooter primary={primary} secondary={secondary} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={abandonConfirmationOpen}
        onOpenChange={setAbandonConfirmationOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Abandonar leitura?</DialogTitle>
            <DialogDescription>
              “{book.title}” deixará de aparecer como uma leitura em andamento,
              mas continuará na sua biblioteca.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAbandonConfirmationOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={props.isStatusPending}
              onClick={confirmAbandon}
            >
              Abandonar leitura
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
