import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMemo, useCallback } from "react";
import { YearFilterChipsProps } from "./yearFilterChips.types";

const YEARS_TO_SHOW = 6;

export function YearFilterChips({ activeYear, onSelect }: YearFilterChipsProps) {
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: YEARS_TO_SHOW }, (_, i) => currentYear - i);
  }, []);

  const handleSelect = useCallback(
    (year: number) => {
      onSelect(activeYear === year ? undefined : year);
    },
    [activeYear, onSelect],
  );

  return (
    <div className="flex items-center gap-2 flex-wrap border-t border-zinc-100 dark:border-zinc-800 pt-3 mt-1 w-full">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider mr-2">
        <CalendarDays size={14} />
        <span>Ano</span>
      </div>
      {years.map((year) => {
        const isActive = activeYear === year;
        return (
          <Button
            key={year}
            size="sm"
            variant="outline"
            onClick={() => handleSelect(year)}
            className={cn(
              "rounded-full h-8 px-3 text-xs font-medium transition-all",
              isActive
                ? "bg-violet-600 border-violet-600 text-white hover:bg-violet-700"
                : "border-zinc-200 text-zinc-500 hover:border-violet-200 hover:text-violet-600 dark:border-zinc-800",
            )}
          >
            {year}
          </Button>
        );
      })}
    </div>
  );
}
