"use client";

import { useMemo, useState } from "react";

import { BookCover } from "@/components/bookCover";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { REVIEWS_COPY } from "../constants";
import { useReviewBookOptions } from "../hooks";
import type { ReviewComposerBook } from "../types";

type ReviewBookPickerProps = {
  onSelect: (book: ReviewComposerBook) => void;
};

export default function ReviewBookPicker({ onSelect }: ReviewBookPickerProps) {
  const { books, isLoading, isError } = useReviewBookOptions(true);
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    if (!term) return books;
    return books.filter((book) =>
      `${book.title} ${book.author ?? ""}`.toLocaleLowerCase().includes(term),
    );
  }, [books, query]);

  return (
    <div className="space-y-3">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={REVIEWS_COPY.searchBooks}
        aria-label={REVIEWS_COPY.searchBooks}
      />
      {isLoading ? (
        <div className="space-y-2" aria-busy="true">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : null}
      {isError ? (
        <p className="text-sm text-muted-foreground">{REVIEWS_COPY.loadError}</p>
      ) : null}
      {!isLoading && !isError && visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">{REVIEWS_COPY.noBooks}</p>
      ) : null}
      <ul className="max-h-72 space-y-1 overflow-y-auto">
        {visible.map((book) => (
          <li key={book.id}>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-muted"
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
              </span>
              {book.hasReview ? (
                <span className={cn("shrink-0 text-xs text-muted-foreground")}>
                  {REVIEWS_COPY.edit}
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
