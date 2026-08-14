"use client";

import { useCallback } from "react";

export function useErrorComponent() {
  const onRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  return { onRefresh };
}
