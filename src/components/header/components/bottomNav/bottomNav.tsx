"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

import { useBottomNav } from "../../hooks/useBottomNav";
import type { BottomNavProps } from "../../types/bottomNav.types";
import MoreSheet from "../moreSheet";
import NavDestinationIcon from "../navDestinationIcon";

export default function BottomNav({
  items,
  overflowItems,
  pathname,
}: BottomNavProps) {
  const { isActive, handlePrefetch, visibleLabel } = useBottomNav(pathname);

  return (
    <nav className="app-bottom-nav" aria-label="Navegação principal">
      {items.map((item) => {
        const active = isActive(item.path);
        const href = item.path ?? "#";

        return (
          <Link
            key={item.label}
            href={href}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className={cn("app-bottom-nav__item", active && "is-active")}
            onMouseEnter={() => {
              void handlePrefetch(item.label);
            }}
            onClick={(event) => {
              if (active) event.preventDefault();
            }}
          >
            <NavDestinationIcon label={item.label} />
            <span>{visibleLabel(item.label)}</span>
          </Link>
        );
      })}
      <MoreSheet items={overflowItems} pathname={pathname} />
    </nav>
  );
}
