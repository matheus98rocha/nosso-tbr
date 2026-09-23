import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
        <Card className="gap-0 border-border/70 bg-card/80 py-0 shadow-sm sm:hidden">
          <CardContent className="p-0">
            <SheetTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="flex h-auto min-h-14 w-full items-center justify-between rounded-xl px-4 py-3 text-left"
            aria-expanded={isSheetOpen}
            aria-controls="mobile-book-filters-content"
          >
            <span className="flex min-w-0 flex-col items-start gap-1">
              <span className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <SlidersHorizontal data-icon="inline-start" />
                Filtros
                {hasActiveFilters && (
                  <Badge variant="secondary" className="text-[10px]">
                    {activeFilterLabels.length} ativos
                  </Badge>
                )}
              </span>
              {hasActiveFilters && (
                <span className="max-w-full truncate text-xs text-muted-foreground">
                  {activeFilterLabels.join(" â€¢ ")}
                </span>
              )}
            </span>
            <ChevronDown aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          </Button>
            </SheetTrigger>
          </CardContent>
        </Card>
        <SheetContent
          side="bottom"
          className="max-h-[90dvh] gap-0 rounded-t-3xl p-0"
        >
          <SheetHeader className="border-b border-border/70 px-5 py-4 text-left">
            <SheetTitle>Filtros</SheetTitle>
            <SheetDescription>
              Ajuste a visão da sua estante e aplique quando terminar.
            </SheetDescription>
          </SheetHeader>
          <div
            id="mobile-book-filters-content"
            className="min-h-0 flex-1 divide-y divide-border/70 overflow-y-auto"
          >
            {children}
          </div>
          <SheetFooter className="border-t border-border/70 bg-background px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
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
    <Card className="max-sm:hidden gap-0 overflow-hidden border-border/70 bg-card/80 py-0 shadow-sm">
      <CardHeader
        className={cn(
          "flex grid-cols-[1fr_auto] items-center gap-3 px-4 py-3",
          !isCollapsed && "border-b border-border/70",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <CardTitle className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <SlidersHorizontal data-icon="inline-start" />
            <span>Filtros</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-[10px] sm:hidden">
                {activeFilterLabels.length} ativos
              </Badge>
            )}
          </CardTitle>
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
                className="truncate overflow-hidden text-xs text-muted-foreground"
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
          className="h-8 shrink-0 gap-1.5 px-2.5 text-xs text-muted-foreground"
          aria-expanded={!isCollapsed}
          aria-controls={contentId}
          aria-label={
            isCollapsed ? "Expandir filtros de livros" : "Recolher filtros de livros"
          }
        >
          {isCollapsed ? (
            <>
              <span>Expandir</span>
              <ChevronDown aria-hidden className="size-4" />
            </>
          ) : (
            <>
              <span>Recolher</span>
              <ChevronUp aria-hidden className="size-4" />
            </>
          )}
        </Button>
      </CardHeader>

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
        <CardContent className="p-0">
          <div className="divide-y divide-border/70">{children}</div>
        </CardContent>
      </motion.div>
    </Card>
  );
}
