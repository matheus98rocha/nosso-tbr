"use client";

import { cn } from "@/lib/utils";

import type { BookEntryModeSwitchProps } from "./bookImportPanel.types";

const modes = [
  { id: "single", label: "Um livro" },
  { id: "bulk", label: "Vários livros" },
] as const;

function BookEntryModeSwitch({ mode, onModeChange }: BookEntryModeSwitchProps) {
  return (
    <div
      role="group"
      aria-label="Como adicionar livros"
      className={cn(
        "flex rounded-full border p-1",
        "border-zinc-200/90 bg-white/70",
        "dark:border-zinc-700/80 dark:bg-zinc-950/30",
      )}
    >
      {modes.map((item) => {
        const isSelected = mode === item.id;

        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onModeChange(item.id)}
            className={cn(
              "min-h-11 flex-1 rounded-full px-3 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isSelected
                ? "bg-zinc-900 text-zinc-50 shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export default BookEntryModeSwitch;
