"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { type SubmitHandler, useForm } from "react-hook-form";
import { userRegistrationMapper } from "@/services/userRegistration/mappers/userRegistration.mapper";
import { registerUser } from "@/services/userRegistration/service/registerUser.service";
import {
  type RegisterUserFormValues,
  registerUserFormSchema,
} from "@/services/userRegistration/validators/userRegistration.validator";

export function useRegister() {
  const form = useForm<RegisterUserFormValues>({
    resolver: zodResolver(registerUserFormSchema),
    defaultValues: {
      email: "",
      password: "",
      password_confirm: "",
      display_name: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: RegisterUserFormValues) =>
      registerUser(userRegistrationMapper.toApiPayload(values)),
  });

  const onValidSubmit: SubmitHandler<RegisterUserFormValues> = async (
    data,
  ) => {
    await mutation.mutateAsync(data);
  };

  return {
    form,
    onSubmit: form.handleSubmit(onValidSubmit),
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
}
