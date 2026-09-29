import { COMMUNITY_PATH } from "@/lib/routes/community";
import { SHELVES_LIST_PATH } from "@/lib/routes/shelves";

import type { NavDestination, NavSurface } from "../types/navCatalog.types";

export type { NavDestination, NavSurface };

export const NAV_DESTINATIONS: NavDestination[] = [
  {
    label: "Início",
    path: "/",
    surfaces: ["desktop", "mobilePrimary"],
  },
  {
    label: "Estatisticas",
    path: "/stats",
    surfaces: ["desktop", "mobilePrimary"],
  },
  {
    label: "Comunidade",
    path: COMMUNITY_PATH,
    requiresAuth: true,
    surfaces: ["desktop", "mobilePrimary"],
  },
  {
    label: "Ver Estantes",
    groupLabel: "Estantes",
    shortLabel: "Estantes",
    path: SHELVES_LIST_PATH,
    surfaces: ["desktop", "mobilePrimary"],
  },
  {
    label: "Adicionar Estante",
    groupLabel: "Estantes",
    surfaces: ["mobileOverflow"],
  },
  {
    label: "Autores",
    path: "/authors",
    requiresAdmin: true,
    surfaces: ["desktop", "mobileOverflow"],
  },
  {
    label: "Administração",
    path: "/admin",
    requiresAdmin: true,
    surfaces: ["desktop", "mobileOverflow"],
  },
  {
    label: "Perfil",
    groupLabel: "Conta",
    path: "/profile",
    requiresAuth: true,
    surfaces: ["mobileOverflow"],
  },
  {
    label: "Login",
    groupLabel: "Conta",
    path: "/auth",
    hideIfLoggedIn: true,
    surfaces: [],
  },
  {
    label: "Logout",
    groupLabel: "Conta",
    requiresAuth: true,
    hideIfLoggedIn: false,
    surfaces: ["mobileOverflow"],
  },
];
