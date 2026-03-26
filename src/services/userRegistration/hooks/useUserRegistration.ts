"use client";

import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { userRegistrationMapper } from "../mappers/userRegistration.mapper";
import { registerUser } from "../service/registerUser.service";
import type { RegisterUserFormValues } from "../types/userRegistration.types";

export function useUserRegistration() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [display_name, setDisplayName] = useState("");

  const { mutateAsync, reset, ...rest } = useMutation({
    mutationFn: (values: RegisterUserFormValues) =>
      registerUser(userRegistrationMapper.toApiPayload(values)),
  });

  const submit = useCallback(async () => {
    await mutateAsync({ email, password, display_name });
  }, [email, password, display_name, mutateAsync]);

  return {
    email,
    setEmail,
    password,
    setPassword,
    display_name,
    setDisplayName,
    submit,
    isPending: rest.isPending,
    isError: rest.isError,
    error: rest.error,
    isSuccess: rest.isSuccess,
    reset,
  };
}
