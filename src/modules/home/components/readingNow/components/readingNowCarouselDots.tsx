"use client";

import { cn } from "@/lib/utils";

import type { ReadingNowCarouselDotsProps } from "../readingNow.types";

export default function ReadingNowCarouselDots({
  total,
  activeIndex,
  onSelect,
}: ReadingNowCarouselDotsProps) {
  if (total <= 1) return null;

  return (
    <div
      className="flex items-center justify-center gap-2 border-t border-zinc-200/60 px-4 py-2.5 dark:border-zinc-800/80"
      role="tablist"
      aria-label="Livros em leitura"
    >
      <span className="mr-0.5 text-[10px] font-medium tabular-nums text-zinc-400 sm:hidden">
        {activeIndex + 1}/{total}
      </span>
      {Array.from({ length: total }).map((_, index) => {
        const isActive = index === activeIndex;

        return (
          <button
            key={`reading-now-dot-${index}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={`Livro ${index + 1} de ${total}`}
            onClick={() => onSelect(index)}
            className={cn(
              "rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50",
              isActive
                ? "h-1.5 w-5 bg-amber-500 shadow-[0_0_6px_-1px_rgba(245,158,11,0.6)]"
                : "h-1.5 w-1.5 bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-600 dark:hover:bg-zinc-500",
            )}
          />
        );
      })}
    </div>
  );
}
