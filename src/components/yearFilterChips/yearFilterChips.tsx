import { memo, useCallback, useMemo } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { YearFilterChipsProps } from "./yearFilterChips.types";

const YEARS_TO_SHOW = 6;

function YearFilterChipsComponent({ activeYear, onSelect }: YearFilterChipsProps) {
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
    <div className="flex flex-col gap-2.5 w-full flex-wrap">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
        <CalendarDays size={11} />
        <span>Ano</span>
      </p>
      <div className="flex flex-wrap gap-2">
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
    </div>
  );
}

export const YearFilterChips = memo(YearFilterChipsComponent);
