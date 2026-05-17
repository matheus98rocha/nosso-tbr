"use client";

import type { KeyboardEvent } from "react";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { ReadingProgressIndicatorProps } from "./types/readingProgressIndicator.types";

const readingProgressTrackClassName = cn(
  "rounded-full bg-emerald-950/[0.08] shadow-inner shadow-emerald-950/[0.06] ring-1 ring-inset ring-emerald-950/[0.08]",
  "dark:bg-emerald-400/[0.12] dark:shadow-emerald-950/20 dark:ring-emerald-400/20",
);

const readingProgressIndicatorClassName = cn(
  "bg-linear-to-r from-emerald-500 via-teal-500 to-emerald-600",
  "shadow-[0_0_10px_-2px_rgba(16,185,129,0.5)] dark:shadow-[0_0_14px_-2px_rgba(52,211,153,0.35)]",
);

function buildAriaLabel(completed: number, total: number, percentage: number) {
  const unidade = total === 1 ? "leitura" : "leituras";
  return `${completed} de ${total} ${unidade} concluídas (${percentage}%)`;
}

export function ReadingProgressIndicator({
  progress,
  variant,
  className,
  onNavigateToSchedule,
}: ReadingProgressIndicatorProps) {
  if (!progress) {
    return null;
  }

  const { total, completed, percentage } = progress;
  const ariaLabel = buildAriaLabel(completed, total, percentage);
  const scheduleActionLabel = `Abrir cronograma — ${ariaLabel}`;

  const handleScheduleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onNavigateToSchedule) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onNavigateToSchedule();
  };

  if (variant === "card") {
    const rowClassName = cn(
      "flex w-full min-w-0 flex-col items-center gap-1.5",
      onNavigateToSchedule &&
        "cursor-pointer rounded-md outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    );

    const inner = (
      <>
        <Progress
          value={percentage}
          aria-label={onNavigateToSchedule ? undefined : ariaLabel}
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          className={cn(
            "h-2.5 min-h-[10px] w-full min-w-0",
            readingProgressTrackClassName,
          )}
          indicatorClassName={readingProgressIndicatorClassName}
        />
        <span
          className="text-center text-xs font-semibold tabular-nums tracking-tight text-emerald-800 dark:text-emerald-300"
          aria-hidden={!!onNavigateToSchedule}
        >
          {percentage}%
        </span>
      </>
    );

    if (onNavigateToSchedule) {
      return (
        <div
          className={cn(rowClassName, className)}
          role="button"
          tabIndex={0}
          aria-label={scheduleActionLabel}
          onClick={onNavigateToSchedule}
          onKeyDown={handleScheduleKeyDown}
        >
          <div className="flex w-full min-w-0 flex-col items-center gap-1.5" aria-hidden>
            {inner}
          </div>
        </div>
      );
    }

    return (
      <div
        className={cn(rowClassName, className)}
        role="group"
        aria-label="Progresso de leitura"
      >
        {inner}
      </div>
    );
  }

  return (
    <section
      className={cn(
        "flex w-full flex-col gap-3 rounded-2xl border border-emerald-900/10 bg-linear-to-br from-emerald-50/90 via-background to-teal-50/50 p-4 shadow-sm shadow-emerald-900/5",
        "dark:border-emerald-400/15 dark:from-emerald-950/35 dark:via-card dark:to-teal-950/25 dark:shadow-black/20",
        className,
      )}
      aria-label="Progresso de leitura"
    >
      <header className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Progresso de leitura
        </span>
        <span
          className="text-lg font-semibold tabular-nums tracking-tight text-emerald-800 dark:text-emerald-300"
          aria-hidden
        >
          {percentage}%
        </span>
      </header>
      <Progress
        value={percentage}
        aria-label={ariaLabel}
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn("h-2.5", readingProgressTrackClassName)}
        indicatorClassName={readingProgressIndicatorClassName}
      />
      <p className="text-xs text-muted-foreground">
        {completed} de {total} {total === 1 ? "dia lido" : "dias lidos"}
      </p>
    </section>
  );
}

export default ReadingProgressIndicator;
