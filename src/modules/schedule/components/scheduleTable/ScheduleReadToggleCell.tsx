"use client";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { ScheduleReadToggleCellProps } from "@/modules/schedule/components/scheduleTable/types/scheduleReadToggleCell.types";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { memo } from "react";

function ScheduleReadToggleCellComponent({
  checked,
  onCheckedChange,
  isBusy,
  rowLabel,
}: ScheduleReadToggleCellProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col items-center justify-center gap-1 sm:flex-row sm:justify-center sm:gap-2">
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={isBusy}
        aria-busy={isBusy}
        aria-label={
          checked
            ? `Marcar ${rowLabel} como pendente`
            : `Marcar ${rowLabel} como concluído`
        }
        className={cn(
          "cursor-pointer",
          isBusy && "disabled:opacity-100",
        )}
      />
      <span className="relative flex min-h-5 min-w-21 items-center justify-center overflow-hidden text-xs font-medium text-zinc-600 dark:text-zinc-400">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={checked ? "done" : "todo"}
            initial={reduceMotion ? false : { opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -5 }}
            transition={{
              duration: reduceMotion ? 0 : 0.16,
              ease: [0.33, 1, 0.68, 1],
            }}
            className="inline-block will-change-transform motion-reduce:transition-none"
          >
            {checked ? "Concluído" : "Pendente"}
          </motion.span>
        </AnimatePresence>
      </span>
    </div>
  );
}

export default memo(ScheduleReadToggleCellComponent);
