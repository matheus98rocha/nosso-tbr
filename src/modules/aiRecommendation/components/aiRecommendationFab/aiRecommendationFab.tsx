"use client";

import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { AiRecommendationFabProps } from "../../types";

function AiRecommendationFab({ onClick }: AiRecommendationFabProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      aria-label="Pedir indicação de leitura para a IA"
      className={cn(
        "fixed bottom-6 right-6 z-40 h-14 w-14 sm:h-auto sm:w-auto sm:px-5 sm:py-3 rounded-full shadow-lg",
        "bg-gradient-to-br from-violet-600 via-fuchsia-500 to-amber-400 text-white",
        "hover:shadow-xl hover:scale-[1.03] active:scale-95 transition-all duration-200",
        "ring-2 ring-white/30",
      )}
    >
      <Sparkles className="size-5 shrink-0" aria-hidden />
      <span className="hidden sm:inline text-sm font-semibold">
        Pedir indicação
      </span>
    </Button>
  );
}

export default AiRecommendationFab;
