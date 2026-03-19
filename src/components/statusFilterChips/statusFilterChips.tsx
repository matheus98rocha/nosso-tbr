import { Book, Bookmark, BookOpen, BookCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  StatusChipConfig,
  StatusFilterChipsProps,
} from "./statusFilterChips.types";

const STATUS_CHIP_CONFIG: StatusChipConfig[] = [
  {
    status: "not_started",
    label: "Não Iniciado",
    Icon: Book,
    activeClass: "bg-slate-600 border-slate-600 text-white hover:bg-slate-700",
    hoverClass:
      "hover:bg-slate-50 hover:text-slate-600 hover:border-slate-200 text-zinc-500 border-zinc-100",
  },
  {
    status: "planned",
    label: "Vou Iniciar",
    Icon: Bookmark,
    activeClass: "bg-blue-600 border-blue-600 text-white hover:bg-blue-700",
    hoverClass:
      "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-zinc-500 border-zinc-100",
  },
  {
    status: "reading",
    label: "Estou Lendo",
    Icon: BookOpen,
    activeClass: "bg-amber-500 border-amber-500 text-white hover:bg-amber-600",
    hoverClass:
      "hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 text-zinc-500 border-zinc-100",
  },
  {
    status: "finished",
    label: "Terminei",
    Icon: BookCheck,
    activeClass:
      "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700",
    hoverClass:
      "hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-zinc-500 border-zinc-100",
  },
];

export function StatusFilterChips({
  activeStatuses,
  onToggle,
}: StatusFilterChipsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {STATUS_CHIP_CONFIG.map(
        ({ status, label, Icon, activeClass, hoverClass }) => {
          const isActive = activeStatuses.includes(status);

          return (
            <Button
              key={status}
              size="sm"
              variant="outline"
              onClick={() => onToggle(status)}
              className={cn(
                "rounded-full h-8 px-4 text-xs font-medium transition-all duration-200 border shadow-sm group",
                isActive ? activeClass : hoverClass,
              )}
            >
              <Icon
                size={13}
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
        },
      )}
    </div>
  );
}
