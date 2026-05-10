"use client";

import { memo } from "react";
import { Loader2, Search, SearchX, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatBookPagesLabel } from "@/utils/formatters";
import { BookLookupPanelProps } from "./bookLookupPanel.types";
import { BookCandidate } from "../../types/bookCandidate.types";

const SOURCE_LABEL: Record<BookCandidate["source"], string> = {
  google_books: "Google Books",
  open_library: "Open Library",
};

const BookLookupPanel = memo(function BookLookupPanel({
  candidates,
  isSearching,
  hasSearched,
  lookupQuery,
  onQueryChange,
  onSearch,
  onSelect,
}: BookLookupPanelProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSearch();
    }
  };

  return (
    <div className="grid gap-3">
      <div className="flex gap-2">
        <Input
          placeholder="Título ou ISBN do livro..."
          value={lookupQuery}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSearching}
          autoFocus={false}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={onSearch}
          disabled={isSearching || !lookupQuery.trim()}
          className="shrink-0"
        >
          {isSearching ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Search className="size-4" />
          )}
          <span className="ml-2 hidden sm:inline">Buscar</span>
        </Button>
      </div>

      {isSearching && (
        <div className="grid gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex gap-3 rounded-lg border border-border p-2 animate-pulse"
            >
              <div className="h-14 w-10 shrink-0 rounded bg-muted" />
              <div className="flex flex-1 flex-col justify-center gap-2">
                <div className="h-3 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isSearching && hasSearched && candidates.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-6 text-muted-foreground">
          <SearchX className="size-8" />
          <p className="text-sm">Nenhum resultado para &ldquo;{lookupQuery}&rdquo;</p>
        </div>
      )}

      {!isSearching && candidates.length > 0 && (
        <div className="grid gap-2">
          {candidates.map((candidate, index) => {
            const pagesLine = formatBookPagesLabel(candidate.pages);
            return (
            <button
              key={`${candidate.isbn ?? candidate.title}-${index}`}
              type="button"
              onClick={() => onSelect(candidate)}
              className="flex gap-3 rounded-lg border border-border p-2 text-left cursor-pointer transition-colors duration-150 hover:bg-muted/60 hover:border-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px] dark:hover:border-violet-800"
            >
              <div className="h-14 w-10 shrink-0 overflow-hidden rounded bg-muted">
                {candidate.image_url ? (
                  <img
                    src={candidate.image_url}
                    alt={`Capa de ${candidate.title}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <BookOpen className="size-4 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col justify-center gap-0.5 min-w-0">
                <p className="text-sm font-medium leading-tight truncate">
                  {candidate.title}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
                  {candidate.author_name}
                </p>
                {pagesLine ? (
                  <p className="text-[11px] tabular-nums text-muted-foreground">
                    {pagesLine}
                  </p>
                ) : null}
                <span className="mt-1 inline-flex w-fit items-center rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {SOURCE_LABEL[candidate.source]}
                </span>
              </div>
            </button>
          );
          })}
        </div>
      )}
    </div>
  );
});

export default BookLookupPanel;
