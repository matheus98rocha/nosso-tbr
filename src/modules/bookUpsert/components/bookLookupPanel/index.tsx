"use client";

import { memo } from "react";
import { BookOpen, CheckCircle2, Loader2, Search, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { BookLookupPanelProps } from "./bookLookupPanel.types";

const BookLookupPanel = memo(function BookLookupPanel({
  isSearching,
  error,
  foundBook,
  lookupQuery,
  onQueryChange,
  onSearch,
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

      {!isSearching && error && (
        <div className="flex flex-col items-center justify-center gap-2 py-6 text-muted-foreground">
          <SearchX className="size-8" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!isSearching && foundBook && (
        <div className="flex gap-3 rounded-lg border border-green-200 bg-green-50/50 p-2 dark:border-green-900 dark:bg-green-950/20">
          <div className="h-14 w-10 shrink-0 overflow-hidden rounded bg-muted">
            {foundBook.url_capa ? (
              <img
                src={foundBook.url_capa}
                alt={`Capa de ${foundBook.nome_do_livro}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <BookOpen className="size-4 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col justify-center gap-0.5 min-w-0">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 shrink-0 text-green-600 dark:text-green-500" />
              <p className="text-xs font-medium text-green-700 dark:text-green-500">
                Preenchido automaticamente
              </p>
            </div>
            <p className="text-sm font-medium leading-tight truncate">
              {foundBook.nome_do_livro}
            </p>
            {foundBook.autor && (
              <p className="text-xs text-muted-foreground truncate">
                {foundBook.autor}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default BookLookupPanel;
