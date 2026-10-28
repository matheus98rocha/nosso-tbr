"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { QUERY_KEYS } from "@/constants/keys";
import { getRegistrationMode } from "@/services/registration";

export type RegisterGateView = "loading" | "error" | "closed" | "form";

export function useRegisterGate() {
  const searchParams = useSearchParams();
  const inviteToken = useMemo(
    () => searchParams.get("invite")?.trim() ?? "",
    [searchParams],
  );

  const registrationQuery = useQuery({
    queryKey: QUERY_KEYS.registration.mode,
    queryFn: getRegistrationMode,
    staleTime: 1000 * 15,
  });

  const mode = registrationQuery.data?.mode ?? null;

  const view = useMemo<RegisterGateView>(() => {
    if (registrationQuery.isPending) return "loading";
    if (registrationQuery.isError || !mode) return "error";
    if (mode === "invite" && inviteToken.length === 0) return "closed";
    return "form";
  }, [
    inviteToken.length,
    mode,
    registrationQuery.isError,
    registrationQuery.isPending,
  ]);

  return {
    inviteToken,
    mode,
    view,
  };
}
