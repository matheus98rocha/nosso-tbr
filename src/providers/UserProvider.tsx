"use client";

import React, { useRef } from "react";
import { useUserStore } from "@/stores/userStore";
import { User } from "@/types/user.types";

export function UserProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: User | null;
}) {
  const syncedKeyRef = useRef<string | undefined>(undefined);
  const key = initialUser?.id ?? "__null__";

  if (syncedKeyRef.current !== key) {
    syncedKeyRef.current = key;
    useUserStore.getState().setUser(initialUser);
  }

  return <>{children}</>;
}
