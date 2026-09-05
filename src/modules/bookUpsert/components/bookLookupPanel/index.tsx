"use client";

import { memo } from "react";
import { BookOpen, CheckCircle2, Loader2, Search, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
      <div
        className={cn(
          "flex gap-2 rounded-xl border border-zinc-200/90 bg-white/80 p-1.5",
          "dark:border-zinc-700/80 dark:bg-zinc-950/40",
          "focus-within:ring-2 focus-within:ring-zinc-900/10 dark:focus-within:ring-zinc-100/15",
        )}
      >
        <Input
          placeholder="Título ou ISBN do livro..."
          value={lookupQuery}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSearching}
          autoFocus={false}
          className="h-10 border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={onSearch}
          disabled={isSearching || !lookupQuery.trim()}
          className="h-10 shrink-0 rounded-lg bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
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
              className="flex gap-3 rounded-xl border border-border/70 p-2.5 animate-pulse"
            >
              <div className="h-16 w-11 shrink-0 rounded-md bg-muted" />
              <div className="flex flex-1 flex-col justify-center gap-2">
                <div className="h-3 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isSearching && error && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300/80 py-6 text-muted-foreground dark:border-zinc-700">
          <SearchX className="size-8" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!isSearching && foundBook && (
        <div
          className={cn(
            "flex gap-3 rounded-xl border p-2.5",
            "border-emerald-200/90 bg-emerald-50/70",
            "dark:border-emerald-900/70 dark:bg-emerald-950/25",
          )}
        >
          <div className="h-16 w-11 shrink-0 overflow-hidden rounded-md bg-muted shadow-sm">
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

          <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                Preenchido automaticamente
              </p>
            </div>
            <p className="truncate text-sm font-semibold leading-tight text-zinc-900 dark:text-zinc-100">
              {foundBook.nome_do_livro}
            </p>
            {foundBook.autor && (
              <p className="truncate text-xs text-muted-foreground">
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
