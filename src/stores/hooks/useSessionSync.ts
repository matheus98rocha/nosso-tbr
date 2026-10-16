"use client";

import { createContext, useContext } from "react";

export const SessionSyncContext = createContext(true);

export function useSessionSync() {
  return useContext(SessionSyncContext);
}
