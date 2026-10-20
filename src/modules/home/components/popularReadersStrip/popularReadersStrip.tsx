"use client";

import Link from "next/link";
import { EyeOff, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { COMMUNITY_PATH } from "@/lib/routes/community";

import PopularReaderCard from "./popularReaderCard";
import type { PopularReadersStripProps } from "./types";

export default function PopularReadersStrip({
  readers,
  isLoading,
  isTogglePending,
  pendingUserId,
  onFollow,
  onHide,
}: PopularReadersStripProps) {
  return (
    <section
      className="mb-5 space-y-3"
      aria-labelledby="popular-readers-title"
      aria-busy={isLoading}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Users
            size={14}
            className="shrink-0 text-[var(--reading-ink)]"
            aria-hidden
          />
          <h2
            id="popular-readers-title"
            className="brand-display text-base font-semibold tracking-tight text-[var(--reading-ink)]"
          >
            Leitores populares
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            asChild
            className="h-9 px-2 text-xs text-muted-foreground"
          >
            <Link href={COMMUNITY_PATH}>Ver comunidade</Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onHide}
            className="h-9 gap-1.5 px-2 text-xs text-muted-foreground"
            aria-label="Esconder leitores populares"
          >
            <EyeOff size={14} aria-hidden />
            Esconder
          </Button>
        </div>
      </div>

      {isLoading ? (
        <ul className="flex gap-3 overflow-x-auto pb-1">
          {Array.from({ length: 4 }).map((_, index) => (
            <li
              key={`popular-reader-skeleton-${index}`}
              className="flex w-[9.5rem] shrink-0 flex-col items-center gap-2.5 rounded-2xl border border-zinc-200/70 p-3 dark:border-zinc-800"
            >
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-11 w-full rounded-full" />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {readers.map((reader) => (
            <PopularReaderCard
              key={reader.id}
              reader={reader}
              isToggleBusy={isTogglePending && pendingUserId === reader.id}
              onFollow={() => onFollow(reader.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
