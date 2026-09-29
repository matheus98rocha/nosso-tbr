"use client";

import { Ban, CheckCircle2, PauseCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { ReadingNowStatusActionsProps } from "../readingNow.types";

const actionButtonClassName =
  "h-8 min-h-8 min-w-0 flex-1 basis-[5.25rem] shrink gap-1 overflow-hidden px-1.5 text-[11px] sm:flex-none sm:basis-auto sm:px-2.5";

export default function ReadingNowStatusActions({
  onFinish,
  onPause,
  onAbandon,
  isPending,
  className,
}: ReadingNowStatusActionsProps) {
  return (
    <div className={cn("flex min-w-0 flex-wrap items-center gap-1.5", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        className={actionButtonClassName}
        onClick={(event) => {
          event.stopPropagation();
          onFinish();
        }}
      >
        <CheckCircle2 className="size-3.5" aria-hidden />
        <span className="truncate">Finalizar</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        className={actionButtonClassName}
        onClick={(event) => {
          event.stopPropagation();
          onPause();
        }}
      >
        <PauseCircle className="size-3.5" aria-hidden />
        <span className="truncate">Pausar</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        className={actionButtonClassName}
        onClick={(event) => {
          event.stopPropagation();
          onAbandon();
        }}
      >
        <Ban className="size-3.5" aria-hidden />
        <span className="truncate">Abandonar</span>
      </Button>
    </div>
  );
}
