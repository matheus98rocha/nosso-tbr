import { cn } from "@/lib/utils";

export const DESKTOP_NAV_SLOT_CLASS =
  "max-lg:hidden min-w-0 flex-1 items-center justify-center overflow-visible lg:flex";

export const BOTTOM_NAV_CLASS = "lg:hidden";

export const HOME_SEARCH_FALLBACK_CLASS =
  "mx-auto h-11 w-full animate-pulse rounded-xl bg-[color-mix(in_oklch,var(--reading-ink)_8%,var(--reading-surface))] md:w-[70%]";

export function mainContentClassName(isLoggedIn: boolean) {
  return cn(
    "flex flex-col items-center gap-6 p-6 pt-36",
    isLoggedIn && "max-lg:pb-28",
  );
}
