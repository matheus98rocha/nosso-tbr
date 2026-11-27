"use client";

import { Infinity as InfinityIcon, Timer } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { FocusModeToggleProps } from "../../types/focus.components.types";

const MODE_OPTIONS = [
  { value: "timer" as const, label: "Timer regressivo", icon: Timer },
  { value: "stopwatch" as const, label: "Cronômetro livre", icon: InfinityIcon },
];

export default function FocusModeToggle({
  mode,
  disabled = false,
  onChange,
}: FocusModeToggleProps) {
  return (
    <div
      role="group"
      aria-label="Modo de contagem"
      className="inline-flex w-full gap-1 rounded-full bg-muted p-1 sm:w-auto"
    >
      {MODE_OPTIONS.map(({ value, label, icon: Icon }) => (
        <Button
          key={value}
          type="button"
          variant={mode === value ? "default" : "ghost"}
          size="sm"
          className="flex-1 rounded-full sm:flex-none"
          aria-pressed={mode === value}
          disabled={disabled}
          onClick={() => onChange(value)}
        >
          <Icon aria-hidden />
          {label}
        </Button>
      ))}
    </div>
  );
}
