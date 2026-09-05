"use client";

import { cn } from "@/lib/utils";
import NextReading from "@/modules/home/components/nextReading";
import ReadingNow from "@/modules/home/components/readingNow";

import type { HomeReadingSpotlightProps } from "./homeReadingSpotlight.types";

export default function HomeReadingSpotlight({
  className,
  onEditBook,
}: HomeReadingSpotlightProps) {
  return (
    <div
      className={cn(
        "mb-5 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 md:items-stretch",
        "empty:mb-0 empty:hidden",
        "[&:has(>:only-child)]:md:grid-cols-1",
        "[&:has(>:only-child)>*]:max-w-2xl",
        className,
      )}
    >
      <ReadingNow className="h-full" onEditBook={onEditBook} />
      <NextReading className="h-full" onEditBook={onEditBook} />
    </div>
  );
}
