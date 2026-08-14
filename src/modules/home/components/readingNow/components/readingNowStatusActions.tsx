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
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        className="h-7 gap-1 px-2.5 text-[11px] border-emerald-200/80 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800/60 dark:text-emerald-200 dark:hover:bg-emerald-950/40"
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
        className="h-7 gap-1 px-2.5 text-[11px] border-violet-200/80 text-violet-800 hover:bg-violet-50 dark:border-violet-800/60 dark:text-violet-200 dark:hover:bg-violet-950/40"
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
        variant="ghost"
        size="sm"
        disabled={isPending}
        className="h-7 gap-1 px-2.5 text-[11px] text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40"
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
