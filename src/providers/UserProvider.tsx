"use client";

import React, { useEffect, useRef } from "react";
import { useUserStore } from "@/stores/userStore";
import { User } from "@/types/user.types";

export function UserProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: User | null;
}) {
  const initialized = useRef(false);

  const myState = useUserStore.getState();

  useEffect(() => {
    if (!initialized.current) {
      myState.setUser(initialUser);
      initialized.current = true;
    }
  }, [initialUser, myState]);

  return <>{children}</>;
}
