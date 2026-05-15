"use client";

import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

import type { AiRecommendationOptionListProps } from "../../types";

function AiRecommendationOptionList({
  options,
  selectedType,
  isLoading,
  onSelect,
}: AiRecommendationOptionListProps) {
  return (
    <div
      className="grid gap-2 sm:grid-cols-2"
      role="listbox"
      aria-label="Tipos de indicação"
    >
      {options.map((option) => {
        const isActive = selectedType === option.type;
        const isBusy = isLoading && isActive;
        const isDisabled = isLoading && !isActive;
        return (
          <button
            key={option.type}
            type="button"
            role="option"
            aria-selected={isActive}
            disabled={isLoading}
            onClick={() => onSelect(option.type)}
            className={cn(
              "group relative flex items-start gap-3 rounded-xl border p-3 text-left transition-all duration-200 cursor-pointer min-h-[64px]",
              "border-zinc-200 bg-white hover:border-violet-300 hover:bg-violet-50/40",
              "dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-violet-900/60 dark:hover:bg-violet-950/20",
              isActive &&
                "border-violet-400 bg-violet-50/70 dark:border-violet-700 dark:bg-violet-950/40",
              isDisabled && "opacity-50 cursor-not-allowed",
            )}
          >
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-lg dark:bg-zinc-900"
              aria-hidden
            >
              {option.icon}
            </span>
            <div className="flex flex-1 flex-col gap-0.5 min-w-0">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                {option.label}
              </span>
              <span className="text-xs text-zinc-600 dark:text-zinc-400 leading-snug">
                {option.description}
              </span>
            </div>
            {isBusy && (
              <Loader2
                className="size-4 shrink-0 animate-spin text-violet-600"
                aria-hidden
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default AiRecommendationOptionList;
