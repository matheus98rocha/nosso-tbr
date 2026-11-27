"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  FOCUS_MAX_MINUTES,
  FOCUS_MIN_MINUTES,
} from "../../constants/focusTimer";
import type { FocusGoalFieldsProps } from "../../types/focus.components.types";

const MINUTE_PRESETS = [15, 25, 45];

function formatSpeed(speed: number): string {
  return speed.toFixed(1).replace(".", ",");
}

export default function FocusGoalFields({
  durationMinutes,
  goalInput,
  goalPages,
  error,
  presets,
  maxPages,
  suggestedMinutes,
  estimatedPages,
  remainingMinutes,
  speed,
  disabled = false,
  onInputChange,
  onSubmit,
  onPreset,
  onClear,
  onAcceptSuggestion,
  onDurationChange,
}: FocusGoalFieldsProps) {
  const [minutesInput, setMinutesInput] = useState(String(durationMinutes));

  useEffect(() => {
    setMinutesInput(String(Math.round(durationMinutes)));
  }, [durationMinutes]);

  const handleGoalSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  const applyMinutes = (minutes: number) => {
    if (minutes < FOCUS_MIN_MINUTES || minutes > FOCUS_MAX_MINUTES) return;

    onDurationChange(minutes);
  };

  return (
    <div className="mt-8 space-y-6">
      <form noValidate onSubmit={handleGoalSubmit} className="space-y-2">
        <Label htmlFor="focus-goal-pages">Páginas pretendidas</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="focus-goal-pages"
            type="number"
            inputMode="numeric"
            min={1}
            max={maxPages}
            step={1}
            value={goalInput}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby="focus-goal-help"
            placeholder="Ex.: 20"
            onChange={(event) => onInputChange(event.target.value)}
          />
          <Button type="submit" variant="outline" disabled={disabled}>
            Definir meta
          </Button>
        </div>
        <p id="focus-goal-help" className="text-xs text-muted-foreground">
          Entre 1 e {maxPages} páginas. Deixe em branco para ler livremente.
        </p>
        {error ? (
          <p role="alert" className="text-xs font-medium text-destructive">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {presets.map((pages) => (
            <Button
              key={pages}
              type="button"
              variant={goalPages === pages ? "default" : "outline"}
              size="sm"
              className="min-w-16 rounded-full"
              aria-pressed={goalPages === pages}
              disabled={disabled}
              onClick={() => onPreset(pages)}
            >
              {pages} pág.
            </Button>
          ))}
          {goalPages !== null ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={onClear}
            >
              Limpar meta
            </Button>
          ) : null}
        </div>
      </form>

      {suggestedMinutes !== null &&
      suggestedMinutes !== Math.round(durationMinutes) ? (
        <div className="flex flex-col gap-3 rounded-lg bg-secondary px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-secondary-foreground">
            Para {goalPages} páginas, sugerimos{" "}
            <strong className="tabular-nums">{suggestedMinutes} min</strong>.
          </p>
          <Button
            type="button"
            size="sm"
            disabled={disabled}
            onClick={onAcceptSuggestion}
          >
            <Check aria-hidden />
            Usar {suggestedMinutes} min
          </Button>
        </div>
      ) : null}

      {goalPages === null && estimatedPages > 0 ? (
        <p className="text-sm text-muted-foreground">
          Com {Math.round(durationMinutes)} min você deve ler cerca de{" "}
          <strong className="tabular-nums text-foreground">
            {estimatedPages} páginas
          </strong>{" "}
          no seu ritmo de {formatSpeed(speed)} páginas/minuto.
        </p>
      ) : null}

      {remainingMinutes !== null && remainingMinutes > 0 ? (
        <p className="text-sm text-muted-foreground">
          Faltam cerca de{" "}
          <strong className="tabular-nums text-foreground">
            {Math.ceil(remainingMinutes)} min
          </strong>{" "}
          para concluir o livro.
        </p>
      ) : null}

      <fieldset disabled={disabled} className="space-y-2">
        <legend className="text-sm font-medium">Duração da sessão</legend>
        <div className="flex flex-wrap gap-2">
          {MINUTE_PRESETS.map((minutes) => (
            <Button
              key={minutes}
              type="button"
              variant={durationMinutes === minutes ? "default" : "outline"}
              size="sm"
              className="min-w-20 rounded-full"
              aria-pressed={durationMinutes === minutes}
              onClick={() => applyMinutes(minutes)}
            >
              {minutes} min
            </Button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="focus-custom-minutes">Ou defina seu tempo</Label>
            <Input
              id="focus-custom-minutes"
              type="number"
              inputMode="numeric"
              min={FOCUS_MIN_MINUTES}
              max={FOCUS_MAX_MINUTES}
              step={1}
              value={minutesInput}
              onChange={(event) => setMinutesInput(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Entre {FOCUS_MIN_MINUTES} e {FOCUS_MAX_MINUTES} minutos.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => applyMinutes(Number(minutesInput))}
          >
            Definir
          </Button>
        </div>
      </fieldset>
    </div>
  );
}
