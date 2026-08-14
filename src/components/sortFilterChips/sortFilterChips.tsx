import { memo, type ElementType } from "react";
import { ArrowDownUp, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { SortChipConfig, SortFilterChipsProps } from "./sortFilterChips.types";
import { SortOption } from "@/types/filters";

const PAGES_SORT_CHIP_CONFIG: SortChipConfig[] = [
  {
    value: "pages_asc",
    label: "Menos páginas",
    ariaLabel: "Ordenar por menor número de páginas",
  },
  {
    value: "pages_desc",
    label: "Mais páginas",
    ariaLabel: "Ordenar por maior número de páginas",
  },
];

const SHELF_SORT_CHIP_CONFIG: SortChipConfig[] = [
  {
    value: "start_date_asc",
    label: "Início (mais antigo primeiro)",
    ariaLabel:
      "Ordenar pela data de início da leitura, da mais antiga à mais recente",
  },
  {
    value: "start_date_desc",
    label: "Início (mais recente primeiro)",
    ariaLabel:
      "Ordenar pela data de início da leitura, da mais recente à mais antiga",
  },
  {
    value: "end_date_asc",
    label: "Término (mais antigo primeiro)",
    ariaLabel:
      "Ordenar pela data de finalização, da mais antiga à mais recente",
  },
  {
    value: "end_date_desc",
    label: "Término (mais recente primeiro)",
    ariaLabel:
      "Ordenar pela data de finalização, da mais recente à mais antiga",
  },
  {
    value: "pages_asc",
    label: "Menos páginas",
    ariaLabel: "Ordenar por menor número de páginas",
  },
  {
    value: "pages_desc",
    label: "Mais páginas",
    ariaLabel: "Ordenar por maior número de páginas",
  },
];

const SORT_ICONS: Record<SortOption | "default", ElementType> = {
  default: ArrowDownUp,
  pages_asc: ArrowUp,
  pages_desc: ArrowDown,
  start_date_asc: ArrowUp,
  start_date_desc: ArrowDown,
  end_date_asc: ArrowUp,
  end_date_desc: ArrowDown,
};

function SortFilterChipsComponent({
  activeSort,
  onSelect,
  isLoading,
  variant = "pages",
}: SortFilterChipsProps) {
  const chipConfig =
    variant === "shelf" ? SHELF_SORT_CHIP_CONFIG : PAGES_SORT_CHIP_CONFIG;

  if (isLoading) {
    return (
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: variant === "shelf" ? 6 : 2 }).map((_, i) => (
          <Skeleton key={`sort-sk-${i}`} className="h-8 w-32 rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {chipConfig.map(({ value, label, ariaLabel }) => {
        const isActive = activeSort === value;
        const Icon = SORT_ICONS[value];

        return (
          <Button
            key={value}
            size="sm"
            variant="outline"
            aria-pressed={isActive}
            aria-label={ariaLabel}
            onClick={() => onSelect(isActive ? undefined : value)}
            className={cn(
              "rounded-full h-8 px-4 text-xs font-medium transition-all duration-200 border shadow-sm group cursor-pointer",
              isActive
                ? "bg-violet-600 border-violet-600 text-white hover:bg-violet-700"
                : "hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 text-zinc-500 border-zinc-100 dark:border-zinc-800 dark:hover:border-violet-800 dark:hover:text-violet-400",
            )}
          >
            <Icon
              size={13}
              aria-hidden
              className={cn(
                "mr-1.5 transition-colors",
                isActive
                  ? "text-white"
                  : "text-zinc-400 group-hover:text-inherit",
              )}
            />
            {label}
          </Button>
        );
      })}
    </div>
  );
}

export const SortFilterChips = memo(SortFilterChipsComponent);
