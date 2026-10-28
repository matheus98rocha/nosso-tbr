"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";

import { QUERY_KEYS } from "@/constants/keys";
import { getRegistrationMode } from "@/services/registration";

export function useLogin() {
  const router = useRouter();

  const registrationQuery = useQuery({
    queryKey: QUERY_KEYS.registration.mode,
    queryFn: getRegistrationMode,
    staleTime: 1000 * 15,
  });

  const canCreateAccount = useMemo(
    () => registrationQuery.data?.mode === "open",
    [registrationQuery.data?.mode],
  );

  const handleRecoverPassword = useCallback(() => {
    router.push(`/forgot-password`);
  }, [router]);

  return {
    canCreateAccount,
    handleRecoverPassword,
  };
}
