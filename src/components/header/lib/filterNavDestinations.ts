import type { NavDestination, NavSurface } from "../types/navCatalog.types";

export function filterNavDestinations(
  destinations: NavDestination[],
  options: { isLoggedIn: boolean; isAdmin: boolean },
): NavDestination[] {
  return destinations.filter((destination) => {
    if (destination.requiresAuth && !options.isLoggedIn) return false;
    if (destination.requiresAdmin && !options.isAdmin) return false;
    if (destination.hideIfLoggedIn && options.isLoggedIn) return false;
    return true;
  });
}

export function selectBySurface(
  destinations: NavDestination[],
  surface: NavSurface,
): NavDestination[] {
  return destinations.filter((destination) =>
    destination.surfaces.includes(surface),
  );
}
