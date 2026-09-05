"use client";

import React, { useRef } from "react";

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

  if (syncedKeyRef.current !== key) {
    syncedKeyRef.current = key;
    useUserStore.getState().setSession(initialUser, initialTier);
  }

  return <>{children}</>;
}
