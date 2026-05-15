"use client";

import { Inbox, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

import AiSuggestionCard from "../aiSuggestionCard";
import type { AiSuggestionsListProps } from "../../types";

function AiSuggestionsList({
  data,
  onPickSuggestion,
  onTryAnother,
}: AiSuggestionsListProps) {
  const hasSuggestions = data.suggestions.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {data.message && (
        <div
          className="flex items-start gap-2 rounded-xl border border-violet-200 bg-violet-50/60 p-3 dark:border-violet-900/60 dark:bg-violet-950/30"
          role="status"
        >
          <Sparkles
            className="size-4 shrink-0 text-violet-600 dark:text-violet-300 mt-0.5"
            aria-hidden
          />
          <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
            {data.message}
          </p>
        </div>
      )}

      {hasSuggestions ? (
        <ul className="flex flex-col gap-3">
          {data.suggestions.map((suggestion, index) => (
            <li key={`${suggestion.title}-${index}`}>
              <AiSuggestionCard
                suggestion={suggestion}
                onAdd={onPickSuggestion}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-6 text-center text-muted-foreground">
          <Inbox className="size-8" aria-hidden />
          <p className="text-sm">
            Sem sugestões dessa vez. Tente uma outra opção.
          </p>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={onTryAnother}
        className="w-full justify-center"
      >
        Tentar outra opção
      </Button>
    </div>
  );
}

export default AiSuggestionsList;
