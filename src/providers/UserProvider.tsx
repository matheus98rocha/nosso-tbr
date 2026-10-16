"use client";

import { useEffect, useState, type ReactNode } from "react";

import type { UserTier } from "@/lib/auth/userTier";
import { SessionSyncContext } from "@/stores/hooks/useSessionSync";
import { useUserStore } from "@/stores/userStore";
import { User } from "@/types/user.types";

export function UserProvider({
  children,
  initialUser,
  initialTier = null,
}: {
  children: ReactNode;
  initialUser: User | null;
  initialTier?: UserTier | null;
}) {
  const key = `${initialUser?.id ?? "__null__"}:${initialTier ?? "__null__"}`;
  const [appliedKey, setAppliedKey] = useState<string | undefined>(undefined);
  const sessionInSync = appliedKey === key;

  useEffect(() => {
    if (appliedKey === key) return;

    useUserStore.getState().setSession(initialUser, initialTier);
    setAppliedKey(key);
  }, [appliedKey, initialTier, initialUser, key]);

  return (
    <SessionSyncContext.Provider value={sessionInSync}>
      {children}
    </SessionSyncContext.Provider>
  );
}
