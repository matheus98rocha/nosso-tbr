"use client";

import { Ban, CheckCircle2, PauseCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { ReadingNowStatusActionsProps } from "../readingNow.types";

export default function ReadingNowStatusActions({
  onFinish,
  onPause,
  onAbandon,
  isPending,
  className,
}: ReadingNowStatusActionsProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        className="h-6 gap-1 px-2 text-[10px] border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        onClick={(event) => {
          event.stopPropagation();
          onFinish();
        }}
      >
        <CheckCircle2 size={12} aria-hidden />
        Finalizar
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        className="h-6 gap-1 px-2 text-[10px] border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        onClick={(event) => {
          event.stopPropagation();
          onPause();
        }}
      >
        <PauseCircle size={12} aria-hidden />
        Pausar
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        className="h-6 gap-1 px-2 text-[10px] border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        onClick={(event) => {
          event.stopPropagation();
          onAbandon();
        }}
      >
        <Ban size={12} aria-hidden />
        Abandonar
      </Button>
    </div>
  );
}
