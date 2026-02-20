"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function useLogin() {
  const router = useRouter();

  const handleRecoverPassword = useCallback(() => {
    router.push(`/forgot-password`);
  }, [router]);

  return {
    handleRecoverPassword,
  };
}
