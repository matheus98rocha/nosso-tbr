import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import type { CollapsibleBookFiltersProps } from "./collapsibleBookFilters.types";
import { useBookFiltersCollapse } from "./hooks";

const collapseTransition = {
  duration: 0.25,
  ease: [0.33, 1, 0.68, 1] as const,
};

export default function CollapsibleBookFilters({
  children,
  activeFilterLabels = [],
}: CollapsibleBookFiltersProps) {
  const { isCollapsed, toggleCollapse } = useBookFiltersCollapse();
  const reduceMotion = useReducedMotion();
  const hasActiveFilters = activeFilterLabels.length > 0;
  const contentId = "book-filters-content";

  return (
    <div className="dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div
        className={cn(
          "flex items-center justify-between gap-3 px-4 py-3",
          !isCollapsed && "border-b border-zinc-200 dark:border-zinc-800",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
            <SlidersHorizontal size={11} />
            Filtros
          </p>
          <AnimatePresence initial={false}>
            {isCollapsed && hasActiveFilters && (
              <motion.p
                key="active-filters-summary"
                initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.2,
                  ease: collapseTransition.ease,
                }}
                className="truncate text-xs text-zinc-500 dark:text-zinc-400 italic overflow-hidden"
              >
                {activeFilterLabels.join(" • ")}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleCollapse}
          className="h-8 shrink-0 gap-1.5 px-2.5 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          aria-expanded={!isCollapsed}
          aria-controls={contentId}
          aria-label={
            isCollapsed ? "Expandir filtros de livros" : "Recolher filtros de livros"
          }
        >
          {isCollapsed ? (
            <>
              <span className="hidden sm:inline">Expandir</span>
              <ChevronDown size={14} />
            </>
          ) : (
            <>
              <span className="hidden sm:inline">Recolher</span>
              <ChevronUp size={14} />
            </>
          )}
        </Button>
      </div>

      <motion.div
        id={contentId}
        initial={false}
        animate={{
          height: isCollapsed ? 0 : "auto",
          opacity: isCollapsed ? 0 : 1,
        }}
        transition={{
          duration: reduceMotion ? 0 : collapseTransition.duration,
          ease: collapseTransition.ease,
        }}
        className="overflow-hidden"
      >
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
