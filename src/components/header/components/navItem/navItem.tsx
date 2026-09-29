import { useMemo } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { NavItemProps } from "../../types/desktopNavMenu.types";
import NavDestinationIcon from "../navDestinationIcon";

export function NavItem({ item, isActive, onPrefetch }: NavItemProps) {
  const itemClassName = useMemo(
    () =>
      cn(
        "desktop-nav__link flex flex-col items-center gap-1.5 px-3 py-2",
        "min-h-[44px] min-w-[52px] justify-center",
        "relative z-0 transition-colors duration-200",
        isActive
          ? "cursor-default text-[var(--reading-ink)]"
          : "cursor-pointer text-[color-mix(in_oklch,var(--reading-ink)_55%,white)] hover:text-[var(--reading-ink)]",
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
        <NavDestinationIcon label={item.label} />
        <span className="text-[11px] leading-none font-medium">{item.label}</span>
      </Link>
    </li>
  );
}
