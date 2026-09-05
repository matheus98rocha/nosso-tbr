import { useUserStore } from "../userStore";
import { isAdminTier } from "@/lib/auth/userTier";

export function useIsLoggedIn() {
  const user = useUserStore((state) => state.user);
  return !!user;
}

export function useRequireAuth() {
  const user = useUserStore((state) => state.user);
  return user;
}

export function useIsAdmin() {
  const tier = useUserStore((state) => state.tier);
  return isAdminTier(tier);
}

export function useUserTier() {
  return useUserStore((state) => state.tier);
}
