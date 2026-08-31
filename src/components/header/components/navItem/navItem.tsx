import { useMemo } from "react";
import Link from "next/link";
import { BarChart3, BookUser, Home, Library } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconMap, NavItemProps } from "../../types/desktopNavMenu.types";

const iconMap: IconMap = {
  Início: <Home className="w-[18px] h-[18px]" />,
  Estatisticas: <BarChart3 className="w-[18px] h-[18px]" />,
  "Ver Estantes": <Library className="w-[18px] h-[18px]" />,
  Autores: <BookUser className="w-[18px] h-[18px]" />,
};

export function NavItem({ item, isActive, onPrefetch }: NavItemProps) {
  const itemClassName = useMemo(
    () =>
      cn(
        "desktop-nav__link flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl",
        "min-w-[52px] min-h-[44px] justify-center",
        "transition-colors duration-200 relative z-0",
        isActive
          ? "text-primary cursor-default"
          : "text-zinc-500 hover:text-primary cursor-pointer",
      ),
    [isActive],
  );

  return (
    <li>
      <Link
        href={item.path || "#"}
        onMouseEnter={() => onPrefetch(item.label)}
        onClick={(e) => isActive && e.preventDefault()}
        className={itemClassName}
        aria-current={isActive ? "page" : undefined}
      >
        {iconMap[item.label]}
        <span className="text-[11px] font-medium leading-none">{item.label}</span>
      </Link>
    </li>
  );
}
