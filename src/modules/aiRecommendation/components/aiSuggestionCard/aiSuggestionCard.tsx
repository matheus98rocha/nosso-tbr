"use client";

import { BookPlus, BookOpen, User } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { AiSuggestionCardProps } from "../../types";

function AiSuggestionCard({ suggestion, onAdd }: AiSuggestionCardProps) {
  return (
    <article
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-950/40"
      aria-label={`Sugestão: ${suggestion.title}`}
    >
      <header className="flex items-start gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300"
          aria-hidden
        >
          <BookOpen className="size-5" />
        </span>
        <div className="flex flex-1 flex-col gap-0.5 min-w-0">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
            {suggestion.title}
          </h3>
          {suggestion.author && (
            <p className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400 truncate">
              <User className="size-3 shrink-0" aria-hidden />
              {suggestion.author}
            </p>
          )}
        </div>
      </header>

      {suggestion.reason && (
        <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
          {suggestion.reason}
        </p>
      )}

      <Button
        type="button"
        size="sm"
        onClick={() => onAdd(suggestion)}
        className="w-full justify-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
        aria-label={`Adicionar ${suggestion.title} à minha biblioteca`}
      >
        <BookPlus className="size-4" aria-hidden />
        Adicionar à minha biblioteca
      </Button>
    </article>
  );
}

export default AiSuggestionCard;
