import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

type YearFilterChipsProps = {
  activeYear: number | undefined;
  onSelect: (year: number | undefined) => void;
};

const YEARS_TO_SHOW = 6;

export function YearFilterChips({ activeYear, onSelect }: YearFilterChipsProps) {
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: YEARS_TO_SHOW }, (_, i) => currentYear - i);
  }, []);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1 text-sm text-muted-foreground mr-1">
        <CalendarDays size={14} />
        <span>Ano:</span>
      </div>
      {years.map((year) => {
        const isActive = activeYear === year;
        return (
          <Button
            key={year}
            size="sm"
            variant={isActive ? "default" : "outline"}
            onClick={() => onSelect(isActive ? undefined : year)}
            className={cn(
              "rounded-full h-8 px-3 text-xs font-medium transition-all",
              isActive
                ? "bg-violet-600 border-violet-600 hover:bg-violet-700 text-white"
                : "border-violet-200 text-violet-600 hover:bg-violet-50 hover:border-violet-400 dark:hover:bg-violet-950",
            )}
          >
            {year}
          </Button>
        );
      })}
    </div>
  );
}
