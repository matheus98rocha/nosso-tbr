import { useUserStore } from "../userStore";

export function useIsLoggedIn() {
  const user = useUserStore((state) => state.user);
  return !!user;
}

export function useRequireAuth() {
  const user = useUserStore((state) => state.user);
  return user;
}
