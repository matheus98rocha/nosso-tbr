import { BookPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { HomeAddBookButtonProps } from "./homeAddBookButton.types";

function HomeAddBookButton({ onClick, className }: HomeAddBookButtonProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      aria-label="Adicionar livro"
      className={cn(
        "fixed bottom-[calc(2rem+env(safe-area-inset-bottom,0px))] left-6 z-40 h-14 w-14 sm:h-auto sm:w-auto sm:px-5 sm:py-3 rounded-full shadow-lg",
        "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-400 text-white",
        "hover:shadow-xl hover:scale-[1.03] active:scale-95 transition-all duration-200",
        "ring-2 ring-white/30",
        className,
      )}
    >
      <BookPlus className="size-5 shrink-0" aria-hidden />
      <span className="hidden sm:inline text-sm font-semibold">
        Adicionar livro
      </span>
    </Button>
  );
}

export default HomeAddBookButton;
