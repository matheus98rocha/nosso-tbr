export type NavSurface = "desktop" | "mobilePrimary" | "mobileOverflow";

export type NavDestination = {
  label: string;
  groupLabel?: string;
  path?: string;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  hideIfLoggedIn?: boolean;
  surfaces: NavSurface[];
  shortLabel?: string;
};
