import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  onClearAll,
}: CollapsibleBookFiltersProps) {
  const { isCollapsed, toggleCollapse } = useBookFiltersCollapse();
  const reduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const hasActiveFilters = activeFilterLabels.length > 0;
  const contentId = "book-filters-content";

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  if (isMobile) {
    return (
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="flex h-auto min-h-12 w-full items-center justify-between rounded-2xl border-zinc-200 bg-card px-4 py-3 text-left shadow-sm dark:border-zinc-800"
            aria-expanded={isSheetOpen}
            aria-controls="mobile-book-filters-content"
          >
            <span className="flex min-w-0 flex-col items-start gap-1">
              <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                <SlidersHorizontal size={12} />
                Filtros
                {hasActiveFilters && (
                  <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold tracking-normal text-violet-700 normal-case dark:bg-violet-950/50 dark:text-violet-300">
                    {activeFilterLabels.length} ativos
                  </span>
                )}
              </span>
              {hasActiveFilters && (
                <span className="max-w-full truncate text-xs italic text-zinc-500 dark:text-zinc-400">
                  {activeFilterLabels.join(" â€¢ ")}
                </span>
              )}
            </span>
            <ChevronDown size={16} className="shrink-0 text-zinc-400" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="max-h-[90dvh] gap-0 rounded-t-3xl p-0"
        >
          <SheetHeader className="border-b px-5 py-4 text-left">
            <SheetTitle>Filtros</SheetTitle>
            <SheetDescription>
              Ajuste a visão da sua estante e aplique quando terminar.
            </SheetDescription>
          </SheetHeader>
          <div
            id="mobile-book-filters-content"
            className="min-h-0 flex-1 divide-y divide-zinc-200 overflow-y-auto dark:divide-zinc-800"
          >
            {children}
          </div>
          <SheetFooter className="border-t bg-background px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
            <SheetClose asChild>
              <Button className="h-11 w-full">Aplicar filtros</Button>
            </SheetClose>
            {onClearAll && (
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full"
                onClick={onClearAll}
              >
                Limpar tudo
              </Button>
            )}
            <SheetClose asChild>
              <Button
                type="button"
                variant="ghost"
                className="h-11 w-full text-muted-foreground"
              >
                Cancelar
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

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
            {hasActiveFilters && (
              <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold tracking-normal text-violet-700 normal-case dark:bg-violet-950/50 dark:text-violet-300 sm:hidden">
                {activeFilterLabels.length} ativos
              </span>
            )}
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
              <span>Expandir</span>
              <ChevronDown size={14} />
            </>
          ) : (
            <>
              <span>Recolher</span>
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
