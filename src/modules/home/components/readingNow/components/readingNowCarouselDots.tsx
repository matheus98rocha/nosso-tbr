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
      className="flex items-center justify-center gap-2 border-t border-border px-4 py-2"
      role="tablist"
      aria-label="Livros em leitura"
    >
      <span className="mr-0.5 text-[11px] font-medium tabular-nums text-muted-foreground sm:hidden">
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
              "cursor-pointer rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
              isActive
                ? "h-1.5 w-5 bg-[var(--reading-ink)] dark:bg-foreground"
                : "h-1.5 w-1.5 bg-border hover:bg-muted-foreground/40",
            )}
          />
        );
      })}
    </div>
  );
}
