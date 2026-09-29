import { useCallback } from "react";

import { NAV_DESTINATIONS } from "../constants/navCatalog";

import { useDesktopNav } from "./useDesktopNav";

export function useBottomNav(pathname: string) {
  const { handlePrefetch } = useDesktopNav();

  const isActive = useCallback(
    (path?: string) => Boolean(path && pathname === path),
    [pathname],
  );

  const visibleLabel = useCallback((label: string) => {
    return (
      NAV_DESTINATIONS.find((destination) => destination.label === label)
        ?.shortLabel ?? label
    );
  }, []);

  return { isActive, handlePrefetch, visibleLabel };
}
