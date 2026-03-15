import { Book, Bookmark, BookOpen, BookCheck, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Status } from "@/types/books.types";

type StatusChipConfig = {
  status: Status;
  label: string;
  Icon: LucideIcon;
  filledClasses: string;
  outlineClasses: string;
};

const STATUS_CHIP_CONFIG: StatusChipConfig[] = [
  {
    status: "not_started",
    label: "Não Iniciado",
    Icon: Book,
    filledClasses: "bg-slate-500 border-slate-500 hover:bg-slate-600 text-white",
    outlineClasses: "border-slate-300 text-slate-500 hover:bg-slate-50 hover:border-slate-500 dark:hover:bg-slate-900",
  },
  {
    status: "planned",
    label: "Vou Iniciar",
    Icon: Bookmark,
    filledClasses: "bg-blue-500 border-blue-500 hover:bg-blue-600 text-white",
    outlineClasses: "border-blue-200 text-blue-500 hover:bg-blue-50 hover:border-blue-400 dark:hover:bg-blue-950",
  },
  {
    status: "reading",
    label: "Já Iniciei",
    Icon: BookOpen,
    filledClasses: "bg-amber-500 border-amber-500 hover:bg-amber-600 text-white",
    outlineClasses: "border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-400 dark:hover:bg-amber-950",
  },
  {
    status: "finished",
    label: "Terminei",
    Icon: BookCheck,
    filledClasses: "bg-emerald-500 border-emerald-500 hover:bg-emerald-600 text-white",
    outlineClasses: "border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-400 dark:hover:bg-emerald-950",
  },
];

type StatusFilterChipsProps = {
  activeStatuses: Status[];
  onToggle: (status: Status) => void;
};

export function StatusFilterChips({
  activeStatuses,
  onToggle,
}: StatusFilterChipsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {STATUS_CHIP_CONFIG.map(({ status, label, Icon, filledClasses, outlineClasses }) => {
        const isActive = activeStatuses.includes(status);
        return (
          <Button
            key={status}
            size="sm"
            variant={isActive ? "default" : "outline"}
            onClick={() => onToggle(status)}
            className={cn(
              "rounded-full",
              isActive ? filledClasses : outlineClasses,
            )}
          >
            <Icon size={13} strokeWidth={isActive ? 2.5 : 1.8} />
            {label}
          </Button>
        );
      })}
    </div>
  );
}
