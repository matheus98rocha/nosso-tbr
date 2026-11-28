"use client";

import { Pause, Play, RotateCcw, SquareCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import {
  FOCUS_MAX_PAGES,
  FOCUS_PAGE_PRESETS,
} from "../../constants/focusSession";
import type { FocusTimerStatus } from "../../types/focus.types";
import type { FocusTimerProps } from "../../types/focus.components.types";
import { formatFocusTime } from "../../utils/formatFocusTime";
import FocusBookCard from "../FocusBookCard";
import FocusBookPicker from "../FocusBookPicker";
import FocusGoalFields from "../FocusGoalFields";
import FocusModeToggle from "../FocusModeToggle";
import FocusSoundToggle from "../FocusSoundToggle";

const STATUS_VIEW: Record<
  FocusTimerStatus,
  { label: string; actionLabel: string }
> = {
  idle: { label: "Pronto para começar", actionLabel: "Iniciar foco" },
  running: { label: "Foco em andamento", actionLabel: "Pausar" },
  paused: { label: "Tempo pausado", actionLabel: "Continuar" },
  finished: { label: "Tempo concluído", actionLabel: "Começar de novo" },
};

export default function FocusTimer({
  mode,
  status,
  displaySeconds,
  progress,
  durationMinutes,
  goalPages,
  estimatedPages,
  remainingMinutes,
  suggestedMinutes,
  speed,
  book,
  books,
  booksLoading,
  booksError,
  goalInput,
  inputError,
  currentPageInput,
  targetPageInput,
  targetPage,
  pageRangeError,
  muted,
  canFinish,
  onModeChange,
  onBookChange,
  onGoalInputChange,
  onGoalSubmit,
  onGoalPreset,
  onGoalClear,
  onCurrentPageChange,
  onTargetPageChange,
  onAcceptSuggestion,
  onDurationChange,
  onToggleMute,
  onStart,
  onPause,
  onReset,
  onFinishSession,
}: FocusTimerProps) {
  const statusView = STATUS_VIEW[status];
  const isRunning = status === "running";
  const controlsDisabled = isRunning || status === "finished";

  const handlePrimaryAction = () => {
    if (isRunning) {
      onPause();
      return;
    }

    onStart();
  };

  return (
    <Card className="gap-0 overflow-hidden">
      <CardContent className="px-5 py-8 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <FocusModeToggle mode={mode} disabled={isRunning} onChange={onModeChange} />
          <FocusSoundToggle muted={muted} onToggle={onToggleMute} />
        </div>

        <div className="mt-8">
          <FocusBookPicker
            books={books}
            selectedBookId={book?.id ?? null}
            disabled={isRunning}
            isLoading={booksLoading}
            isError={booksError}
            onSelect={onBookChange}
          />
          {book ? <FocusBookCard book={book} /> : null}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
            {mode === "timer" ? "Tempo restante" : "Tempo de foco"}
          </p>
          <div
            role="timer"
            aria-label={mode === "timer" ? "Tempo restante" : "Tempo de foco"}
            className="brand-display mt-2 text-6xl font-semibold tracking-tight tabular-nums text-[var(--reading-ink)] sm:text-7xl"
          >
            {formatFocusTime(displaySeconds)}
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <Progress
            value={mode === "timer" ? progress : 0}
            aria-label="Progresso do foco"
            className="h-2.5"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span aria-live="polite">{statusView.label}</span>
            <span className="tabular-nums">
              {goalPages === null
                ? `${Math.round(durationMinutes)} min selecionados`
                : `Meta: ${goalPages} páginas`}
            </span>
          </div>
        </div>

        {status === "finished" ? (
          <p
            role="status"
            className="mt-5 rounded-lg bg-secondary px-4 py-3 text-center text-sm font-medium text-secondary-foreground"
          >
            Seu tempo acabou. Registre em qual página você parou.
          </p>
        ) : null}

        <FocusGoalFields
          durationMinutes={durationMinutes}
          goalInput={goalInput}
          goalPages={goalPages}
          error={inputError}
          presets={FOCUS_PAGE_PRESETS}
          maxPages={book?.pages ?? FOCUS_MAX_PAGES}
          suggestedMinutes={suggestedMinutes}
          estimatedPages={estimatedPages}
          remainingMinutes={remainingMinutes}
          speed={speed}
          book={book}
          currentPageInput={currentPageInput}
          targetPageInput={targetPageInput}
          targetPage={targetPage}
          pageRangeError={pageRangeError}
          disabled={controlsDisabled}
          onInputChange={onGoalInputChange}
          onSubmit={onGoalSubmit}
          onPreset={onGoalPreset}
          onClear={onGoalClear}
          onCurrentPageChange={onCurrentPageChange}
          onTargetPageChange={onTargetPageChange}
          onAcceptSuggestion={onAcceptSuggestion}
          onDurationChange={onDurationChange}
        />

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            size="lg"
            className="flex-1"
            onClick={handlePrimaryAction}
          >
            {isRunning ? <Pause aria-hidden /> : <Play aria-hidden />}
            {statusView.actionLabel}
          </Button>
          {canFinish ? (
            <Button
              type="button"
              size="lg"
              variant="secondary"
              className="flex-1"
              onClick={onFinishSession}
            >
              <SquareCheck aria-hidden />
              Encerrar e registrar
            </Button>
          ) : null}
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="flex-1"
            disabled={status === "idle"}
            onClick={onReset}
          >
            <RotateCcw aria-hidden />
            Reiniciar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
