"use client";

import React, { useEffect, useRef } from "react";

import type { UserTier } from "@/lib/auth/userTier";
import { useUserStore } from "@/stores/userStore";
import { User } from "@/types/user.types";

export function UserProvider({
  children,
  initialUser,
  initialTier = null,
}: {
  children: React.ReactNode;
  initialUser: User | null;
  initialTier?: UserTier | null;
}) {
  const syncedKeyRef = useRef<string | undefined>(undefined);
  const key = `${initialUser?.id ?? "__null__"}:${initialTier ?? "__null__"}`;

  useEffect(() => {
    if (syncedKeyRef.current === key) return;

    syncedKeyRef.current = key;
    useUserStore.getState().setSession(initialUser, initialTier);
  }, [initialTier, initialUser, key]);

  return <>{children}</>;
}
