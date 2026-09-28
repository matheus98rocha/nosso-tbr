"use client";

import { Ban, CheckCircle2, PauseCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { ReadingNowStatusActionsProps } from "../readingNow.types";

const actionButtonClassName =
  "h-8 min-h-8 min-w-0 flex-1 gap-1 px-2 text-[11px] sm:flex-none sm:px-2.5";

export default function ReadingNowStatusActions({
  onFinish,
  onPause,
  onAbandon,
  isPending,
  className,
}: ReadingNowStatusActionsProps) {
  return (
    <div className={cn("grid grid-cols-3 gap-1.5 sm:flex sm:flex-nowrap", className)}>
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
        Finalizar
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
        Pausar
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
        Abandonar
      </Button>
    </div>
  );
}
