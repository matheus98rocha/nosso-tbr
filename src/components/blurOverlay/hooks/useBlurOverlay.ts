"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function useBlurOverlay() {
  const router = useRouter();

  const goToAuth = useCallback(() => {
    router.push("/auth");
  }, [router]);

  return { goToAuth };
}
