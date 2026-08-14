import { useMemo } from "react";
import Link from "next/link";
import { BarChart3, BookUser, Library, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconMap, NavItemProps } from "../../types/desktopNavMenu.types";

const iconMap: IconMap = {
  "Adicionar Livro": <Plus className="w-[18px] h-[18px]" />,
  Estatisticas: <BarChart3 className="w-[18px] h-[18px]" />,
  "Ver Estantes": <Library className="w-[18px] h-[18px]" />,
  Autores: <BookUser className="w-[18px] h-[18px]" />,
};

export function NavItem({
  item,
  isActive,
  onPrefetch,
  onOpenModal,
}: NavItemProps) {
  const isAddBook = item.label === "Adicionar Livro";

  const itemClassName = useMemo(
    () =>
      cn(
        "flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl",
        "min-w-[52px] min-h-[44px] justify-center",
        "transition-colors duration-200",
        isActive
          ? "text-primary bg-primary/8 cursor-default"
          : "text-zinc-500 hover:text-primary hover:bg-zinc-100 cursor-pointer",
      ),
    [isActive],
  );

  const content = (
    <>
      {iconMap[item.label]}
      <span className="text-[11px] font-medium leading-none">{item.label}</span>
    </>
  );

  if (isAddBook) {
    return (
      <button
        onClick={onOpenModal}
        className={itemClassName}
        type="button"
        aria-label="Adicionar novo livro"
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={item.path || "#"}
      onMouseEnter={() => onPrefetch(item.label)}
      onClick={(e) => isActive && e.preventDefault()}
      className={itemClassName}
      aria-current={isActive ? "page" : undefined}
    >
      {content}
    </Link>
  );
}
