"use client";

import BookCover from "@/components/bookCover/bookCover";
import { Progress } from "@/components/ui/progress";

import type { FocusBookCardProps } from "../../types/focus.components.types";

export default function FocusBookCard({ book }: FocusBookCardProps) {
  const currentPage = Math.min(book.currentPage, book.pages);
  const percentage =
    book.pages > 0 ? Math.round((currentPage / book.pages) * 100) : 0;

  return (
    <div className="mt-4 flex gap-4 rounded-xl border bg-background/60 p-4">
      <BookCover
        src={book.imageUrl}
        alt={`Capa de ${book.title}`}
        width={56}
        height={80}
        className="rounded-md"
        containerClassName="rounded-md shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold leading-snug">{book.title}</p>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {book.author}
        </p>
        <div className="mt-3 space-y-1.5">
          <Progress
            value={percentage}
            aria-label={`Progresso de ${book.title}`}
            className="h-1.5"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="tabular-nums">
              Página {currentPage} de {book.pages}
            </span>
            <span className="tabular-nums">{percentage}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
