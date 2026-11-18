"use client";

import { Loader2 } from "lucide-react";

import { BookCover } from "@/components/bookCover";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import ReadingRatingStarsRow from "@/modules/bookRating/components/readingRatingStarsRow";

import { REVIEWS_COPY } from "../constants";
import { useReviewComposerForm } from "../hooks";
import ReviewBookPicker from "./reviewBookPicker";
import ReviewBookStatusBadge from "./reviewBookStatusBadge";

export default function ReviewComposerDialog() {
  const form = useReviewComposerForm();
  const title =
    form.mode === "finish"
      ? REVIEWS_COPY.finishTitle
      : form.hasExistingReview
        ? REVIEWS_COPY.edit
        : REVIEWS_COPY.composeTitle;
  const actionLabel = form.submission.savesRatingOnly
    ? REVIEWS_COPY.saveRating
    : form.hasExistingReview
      ? REVIEWS_COPY.save
      : REVIEWS_COPY.publish;

  return (
    <Dialog
      open={form.open}
      onOpenChange={(next) => {
        if (!next) form.requestClose();
      }}
    >
      <DialogContent className="flex max-h-[min(90dvh,44rem)] min-w-0 flex-col overflow-x-hidden overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {form.mode === "finish" ? REVIEWS_COPY.finishHint : REVIEWS_COPY.composeHint}
          </DialogDescription>
        </DialogHeader>

        {!form.book ? <ReviewBookPicker onSelect={form.selectBook} /> : null}

        {form.book ? (
          <div className="min-w-0 space-y-4">
            <div className="flex min-w-0 items-center gap-3">
              <BookCover
                src={form.book.imageUrl}
                alt=""
                width={42}
                height={62}
                containerClassName="relative h-[62px] w-[42px] shrink-0 overflow-hidden rounded-md"
              />
              <div className="min-w-0">
                <p className="truncate font-medium">{form.book.title}</p>
                {form.book.author ? (
                  <p className="truncate text-sm text-muted-foreground">{form.book.author}</p>
                ) : null}
                <div className="mt-1">
                  <ReviewBookStatusBadge status={form.book.status} />
                </div>
              </div>
            </div>
            {form.book.isSolo ? (
              <p className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                {REVIEWS_COPY.privateBook}
              </p>
            ) : null}
            <div className="space-y-2">
              <p className="text-sm font-medium">{REVIEWS_COPY.starsLabel}</p>
              <ReadingRatingStarsRow
                displayValue={form.stars}
                disabled={!form.starsAvailable || form.isSaving || form.isLoadingExisting}
                ariaOwnsSuffix={form.book.id}
                onPick={form.setStars}
              />
              {form.starsAvailable ? null : (
                <p className="text-sm text-muted-foreground">{REVIEWS_COPY.starsLocked}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="review-content" className="text-sm font-medium">
                {REVIEWS_COPY.textLabel}
              </label>
              <Textarea
                id="review-content"
                value={form.content}
                maxLength={500}
                rows={6}
                disabled={form.isSaving || form.isLoadingExisting}
                aria-describedby="review-content-count"
                onChange={(event) => form.setContent(event.target.value)}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                    event.preventDefault();
                    form.submit();
                  }
                }}
              />
              <p
                id="review-content-count"
                className={cn(
                  "text-right text-xs tabular-nums text-muted-foreground",
                  form.contentState.tone === "warn" && "text-amber-600",
                  form.contentState.tone === "limit" && "text-destructive",
                )}
              >
                {form.contentState.counter}
              </p>
            </div>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:justify-between">
          {form.confirmDiscard ? (
            <>
              <p className="text-sm text-muted-foreground sm:mr-auto">
                {REVIEWS_COPY.discardBody}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => form.setConfirmDiscard(false)}
              >
                {REVIEWS_COPY.keepWriting}
              </Button>
              <Button type="button" variant="destructive" onClick={form.discard}>
                {REVIEWS_COPY.discard}
              </Button>
            </>
          ) : (
            <>
              {form.mode === "finish" ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={form.requestClose}
                  disabled={form.isSaving}
                >
                  {REVIEWS_COPY.skip}
                </Button>
              ) : (
                <span />
              )}
              <Button
                type="button"
                onClick={form.submit}
                disabled={!form.book || !form.submission.ok || form.isSaving || form.isLoadingExisting}
              >
                {form.isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                {actionLabel}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
