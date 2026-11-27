"use client";

import { useCallback, useState, type FormEvent } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

import {
  FOCUS_MAX_MINUTES,
  FOCUS_MIN_MINUTES,
} from "../../constants/focusTimer";
import { useFocusTimer } from "../../hooks/useFocusTimer";
import type { FocusTimerStatus } from "../../types/focus.types";
import { formatFocusTime } from "../../utils/formatFocusTime";
import { playFocusNotificationSound } from "../../utils/playFocusNotificationSound";

const PRESET_MINUTES = [15, 25, 45];

const STATUS_LABEL: Record<FocusTimerStatus, string> = {
  idle: "Pronto para começar",
  running: "Foco em andamento",
  paused: "Tempo pausado",
  finished: "Tempo concluído",
};

export function FocusTimer() {
  const [customMinutes, setCustomMinutes] = useState("25");
  const [inputError, setInputError] = useState<string | null>(null);
  const {
    durationSeconds,
    remainingSeconds,
    status,
    progress,
    setDurationMinutes,
    start,
    pause,
    reset,
  } = useFocusTimer({ onFinish: playFocusNotificationSound });

  const durationMinutes = Math.round(durationSeconds / 60);
  const isRunning = status === "running";

  const applyMinutes = useCallback(
    (minutes: number) => {
      const roundedMinutes = Math.round(minutes);

      if (
        !Number.isFinite(roundedMinutes) ||
        roundedMinutes < FOCUS_MIN_MINUTES ||
        roundedMinutes > FOCUS_MAX_MINUTES
      ) {
        setInputError(
          `Escolha entre ${FOCUS_MIN_MINUTES} e ${FOCUS_MAX_MINUTES} minutos.`,
        );
        return;
      }

      setInputError(null);
      setCustomMinutes(String(roundedMinutes));
      setDurationMinutes(roundedMinutes);
    },
    [setDurationMinutes],
  );

  const handleCustomSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyMinutes(Number(customMinutes));
  };

  const primaryLabel =
    status === "running"
      ? "Pausar"
      : status === "paused"
        ? "Continuar"
        : status === "finished"
          ? "Começar de novo"
          : "Iniciar foco";

  return (
    <Card className="gap-0 overflow-hidden">
      <CardContent className="px-5 py-8 sm:px-8">
        <div className="text-center">
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
            Tempo restante
          </p>
          <div
            role="timer"
            aria-label="Tempo restante"
            className="brand-display mt-2 text-6xl font-semibold tracking-tight tabular-nums text-[var(--reading-ink)] sm:text-7xl"
          >
            {formatFocusTime(remainingSeconds)}
          </div>
        </div>

        <div className="mt-8 space-y-2">
          <Progress
            value={progress}
            aria-label="Progresso do foco"
            className="h-2.5"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span aria-live="polite">{STATUS_LABEL[status]}</span>
            <span className="tabular-nums">{progress}% concluído</span>
          </div>
        </div>

        {status === "finished" ? (
          <p
            role="status"
            className="mt-5 rounded-lg bg-secondary px-4 py-3 text-center text-sm font-medium text-secondary-foreground"
          >
            Seu tempo acabou. Faça uma pausa e volte quando quiser.
          </p>
        ) : null}

        <fieldset className="mt-8">
          <legend className="text-sm font-medium">Durações sugeridas</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {PRESET_MINUTES.map((minutes) => (
              <Button
                key={minutes}
                type="button"
                variant={durationMinutes === minutes ? "default" : "outline"}
                size="sm"
                className="min-w-20 rounded-full"
                aria-pressed={durationMinutes === minutes}
                disabled={isRunning}
                onClick={() => applyMinutes(minutes)}
              >
                {minutes} min
              </Button>
            ))}
          </div>
        </fieldset>

        <form
          noValidate
          onSubmit={handleCustomSubmit}
          className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="focus-custom-minutes">Ou defina seu tempo</Label>
            <Input
              id="focus-custom-minutes"
              type="number"
              inputMode="numeric"
              min={FOCUS_MIN_MINUTES}
              max={FOCUS_MAX_MINUTES}
              step={1}
              value={customMinutes}
              disabled={isRunning}
              aria-invalid={Boolean(inputError)}
              aria-describedby="focus-custom-help"
              onChange={(event) => {
                setCustomMinutes(event.target.value);
                setInputError(null);
              }}
            />
            <p id="focus-custom-help" className="text-xs text-muted-foreground">
              Entre {FOCUS_MIN_MINUTES} e {FOCUS_MAX_MINUTES} minutos.
            </p>
            {inputError ? (
              <p role="alert" className="text-xs font-medium text-destructive">
                {inputError}
              </p>
            ) : null}
          </div>
          <Button type="submit" variant="outline" disabled={isRunning}>
            Definir
          </Button>
        </form>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            size="lg"
            className="flex-1"
            onClick={isRunning ? pause : start}
          >
            {isRunning ? <Pause aria-hidden /> : <Play aria-hidden />}
            {primaryLabel}
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="flex-1"
            disabled={status === "idle"}
            onClick={reset}
          >
            <RotateCcw aria-hidden />
            Reiniciar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
