"use client";

import { BookPlus, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FAB_BOTTOM_CLASS } from "@/constants/floatingActionButton";
import { cn } from "@/lib/utils";

import type { HomeQuickActionsProps } from "./homeQuickActions.types";

function HomeQuickActions({
  onAddBook,
  onRequestRecommendation,
  className,
}: HomeQuickActionsProps) {
  return (
    <nav
      aria-label="Ações rápidas da estante"
      className={cn(
        "fixed left-1/2 z-40 -translate-x-1/2",
        FAB_BOTTOM_CLASS,
        "animate-in fade-in slide-in-from-bottom-3 duration-500",
        className,
      )}
    >
      <div
        className={cn(
          "flex w-max max-w-[calc(100vw-1.5rem)] items-center gap-1 rounded-[1.35rem] p-1.5",
          "border border-zinc-200/90 dark:border-zinc-700/80",
          "bg-[linear-gradient(180deg,rgba(255,253,248,0.94),rgba(250,246,239,0.9))]",
          "dark:bg-[linear-gradient(180deg,rgba(39,39,42,0.94),rgba(24,24,27,0.92))]",
          "shadow-[0_12px_40px_-12px_rgba(24,24,27,0.35),0_0_0_1px_rgba(255,255,255,0.4)_inset]",
          "dark:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.06)_inset]",
          "backdrop-blur-xl",
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              onClick={onAddBook}
              aria-label="Adicionar livro"
              className={cn(
                "h-12 shrink-0 gap-2 whitespace-nowrap rounded-[1.05rem] px-4",
                "bg-zinc-900 text-zinc-50 hover:bg-zinc-800",
                "dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white",
                "shadow-[0_6px_16px_-6px_rgba(24,24,27,0.55)]",
                "transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]",
              )}
            >
              <BookPlus className="size-5 shrink-0" aria-hidden />
              <span className="text-base font-semibold tracking-tight">
                Adicionar livro
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8} className="max-w-xs text-pretty">
            Cadastre um novo livro na sua lista de leitura
          </TooltipContent>
        </Tooltip>

        <div
          className="mx-0.5 h-8 w-px shrink-0 bg-zinc-300/80 dark:bg-zinc-600/80"
          aria-hidden
        />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              onClick={onRequestRecommendation}
              aria-label="Pedir indicação de leitura para a IA"
              className={cn(
                "h-12 shrink-0 gap-2 whitespace-nowrap rounded-[1.05rem] px-4",
                "bg-amber-100/90 text-amber-950 hover:bg-amber-200/90",
                "dark:bg-amber-400/15 dark:text-amber-100 dark:hover:bg-amber-400/25",
                "border border-amber-300/60 dark:border-amber-400/25",
                "shadow-[0_6px_16px_-8px_rgba(180,83,9,0.35)]",
                "transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]",
              )}
            >
              <Sparkles
                className="size-5 shrink-0 text-amber-700 dark:text-amber-300"
                aria-hidden
              />
              <span className="text-base font-semibold tracking-tight">
                Indicação com IA
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8} className="max-w-xs text-pretty">
            Peça uma sugestão de leitura gerada por inteligência artificial
          </TooltipContent>
        </Tooltip>
      </div>
    </nav>
  );
}

export default HomeQuickActions;
