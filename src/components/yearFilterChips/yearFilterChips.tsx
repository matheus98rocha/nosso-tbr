import { memo } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { YearFilterChipsProps } from "./yearFilterChips.types";
import { useYearFilterChips } from "./hooks/useYearFilterChips";
import { Skeleton } from "../ui/skeleton";

function YearFilterChipsComponent(props: YearFilterChipsProps) {
  const { activeYear } = props;
  const { isLoading, yearsList, handleSelect } = useYearFilterChips(props);

  return (
    <>
      {isLoading ? (
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={`year-sk-${i}`} className="h-8 w-16 rounded-full" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 w-full flex-wrap">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
            <CalendarDays size={11} />
            <span>Ano</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {yearsList.map((year) => {
              const isActive = activeYear === year;
              return (
                <Button
                  key={year}
                  size="sm"
                  variant="outline"
                  aria-pressed={isActive}
                  aria-label={`Filtrar por ano ${year}`}
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
      )}
    </>
  );
}

export const YearFilterChips = memo(YearFilterChipsComponent);
