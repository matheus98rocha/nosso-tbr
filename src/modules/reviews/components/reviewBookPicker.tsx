"use client";

import { BookCover } from "@/components/bookCover";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import { REVIEWS_COPY } from "../constants";
import { useReviewBookPicker } from "../hooks";
import type { ReviewBookPickerProps } from "../types";
import ReviewBookStatusBadge from "./reviewBookStatusBadge";

export default function ReviewBookPicker({ onSelect }: ReviewBookPickerProps) {
  const { query, onQueryChange, visibleBooks, isLoading, isError } = useReviewBookPicker(true);

  return (
    <div className="flex min-h-0 min-w-0 flex-col gap-3">
      <Input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={REVIEWS_COPY.searchBooks}
        aria-label={REVIEWS_COPY.searchBooks}
        className="shrink-0"
      />
      {isLoading ? (
        <div className="space-y-2" aria-busy="true">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : null}
      {isError ? <p className="text-sm text-muted-foreground">{REVIEWS_COPY.loadError}</p> : null}
      {!isLoading && !isError && visibleBooks.length === 0 ? (
        <p className="text-sm text-muted-foreground">{REVIEWS_COPY.noBooks}</p>
      ) : null}
      <ul className="max-h-[min(18rem,45dvh)] min-w-0 space-y-1 overflow-x-hidden overflow-y-auto overscroll-contain">
        {visibleBooks.map((book) => (
          <li key={book.id} className="min-w-0">
            <button
              type="button"
              className="flex w-full min-w-0 items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-muted"
              onClick={() =>
                onSelect({
                  id: book.id,
                  title: book.title,
                  author: book.author,
                  imageUrl: book.imageUrl,
                  status: book.status,
                  isSolo: book.isSolo,
                })
              }
            >
              <BookCover
                src={book.imageUrl}
                alt=""
                width={36}
                height={52}
                containerClassName="relative h-[52px] w-9 shrink-0 overflow-hidden rounded-md"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{book.title}</span>
                {book.author ? (
                  <span className="block truncate text-xs text-muted-foreground">
                    {book.author}
                  </span>
                ) : null}
                <span className="mt-1 flex min-w-0">
                  <ReviewBookStatusBadge status={book.status} />
                </span>
              </span>
              {book.hasReview ? (
                <span className="shrink-0 text-xs text-muted-foreground">{REVIEWS_COPY.edit}</span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
