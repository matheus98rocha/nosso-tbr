import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";

import { useModal } from "@/hooks/";
import { useIsAdmin, useIsLoggedIn } from "@/stores/hooks/useAuth";
import { useUserStore } from "@/stores/userStore";

import { NAV_DESTINATIONS } from "../constants/navCatalog";
import {
  filterNavDestinations,
  selectBySurface,
} from "../lib/filterNavDestinations";
import type { Menu, MenuItem } from "../types/header.types";
import type { NavDestination } from "../types/navCatalog.types";

export function useHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const createShelfDialog = useModal();
  const logout = useUserStore((state) => state.logout);
  const isLoggedIn = useIsLoggedIn();
  const isAdmin = useIsAdmin();

  const bindDestination = useCallback(
    (destination: NavDestination): MenuItem => {
      const path = destination.path;
      let action: () => void = () => {
        return;
      };

      if (destination.label === "Adicionar Estante") {
        action = () => createShelfDialog.setIsOpen(true);
      } else if (destination.label === "Logout") {
        action = () => {
          void logout();
        };
      } else if (path) {
        action = () => router.push(path);
      }

      return {
        label: destination.label,
        path,
        action,
        requiresAuth: destination.requiresAuth,
        requiresAdmin: destination.requiresAdmin,
        hideIfLoggedIn: destination.hideIfLoggedIn,
      };
    },
    [createShelfDialog, logout, router],
  );

  const visibleDestinations = useMemo(
    () =>
      filterNavDestinations(NAV_DESTINATIONS, {
        isLoggedIn,
        isAdmin,
      }),
    [isAdmin, isLoggedIn],
  );

  const menuItems = useMemo((): Menu[] => {
    const groups: Menu[] = [];

    for (const destination of visibleDestinations) {
      const groupLabel = destination.groupLabel ?? destination.label;
      const item = bindDestination(destination);
      const last = groups.at(-1);

      if (last?.label === groupLabel) {
        last.items.push(item);
      } else {
        groups.push({ label: groupLabel, items: [item] });
      }
    }

    return groups;
  }, [bindDestination, visibleDestinations]);

  const desktopNavItems = useMemo(
    () => selectBySurface(visibleDestinations, "desktop").map(bindDestination),
    [bindDestination, visibleDestinations],
  );

  const mobilePrimaryItems = useMemo(
    () =>
      selectBySurface(visibleDestinations, "mobilePrimary").map(bindDestination),
    [bindDestination, visibleDestinations],
  );

  const mobileOverflowItems = useMemo(
    () =>
      selectBySurface(visibleDestinations, "mobileOverflow").map(
        bindDestination,
      ),
    [bindDestination, visibleDestinations],
  );

  return {
    menuItems,
    desktopNavItems,
    mobilePrimaryItems,
    mobileOverflowItems,
    createShelfDialog,
    logout,
    isLoggedIn,
    isAdmin,
    router,
    pathname,
  };
}
