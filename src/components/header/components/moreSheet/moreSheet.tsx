"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { useBottomNav } from "../../hooks/useBottomNav";
import type { MoreSheetProps } from "../../types/moreSheet.types";
import NavDestinationIcon from "../navDestinationIcon";

export default function MoreSheet({ items, pathname }: MoreSheetProps) {
  const { isActive } = useBottomNav(pathname);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="app-bottom-nav__item"
          aria-label="Abrir mais destinos"
        >
          <NavDestinationIcon label="Mais" />
          <span>Mais</span>
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="app-more-sheet max-h-[min(80dvh,36rem)] gap-0 p-0 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <SheetHeader className="border-b border-[color-mix(in_oklch,var(--reading-ink)_12%,transparent)] px-6 py-5">
          <SheetTitle className="brand-display text-left text-lg font-semibold tracking-tight text-[var(--reading-ink)]">
            Mais
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {items.map((item) => {
            const active = isActive(item.path);

            return (
              <SheetClose asChild key={item.label}>
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(
                    "h-12 cursor-pointer justify-start gap-3 rounded-xl px-3 text-sm font-medium",
                    active
                      ? "bg-[color-mix(in_oklch,var(--reading-ink)_8%,transparent)] text-[var(--reading-ink)]"
                      : "text-[color-mix(in_oklch,var(--reading-ink)_72%,white)] hover:bg-[color-mix(in_oklch,var(--reading-ink)_6%,transparent)] hover:text-[var(--reading-ink)]",
                  )}
                  onClick={active ? undefined : item.action}
                  disabled={active}
                >
                  <NavDestinationIcon label={item.label} />
                  {item.label}
                </Button>
              </SheetClose>
            );
          })}
        </div>
        <SheetFooter className="border-t border-[color-mix(in_oklch,var(--reading-ink)_12%,transparent)] px-4 py-4">
          <SheetClose asChild>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full cursor-pointer rounded-xl font-medium"
            >
              Fechar
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
