"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useUserStore } from "@/stores/userStore";

export function useRefreshSessionAfterLogout(sessionInSync: boolean) {
  const router = useRouter();
  const sessionReady = useUserStore((state) => state.sessionReady);

  useEffect(() => {
    if (!sessionInSync || sessionReady) return;
    router.refresh();
  }, [router, sessionInSync, sessionReady]);
}
