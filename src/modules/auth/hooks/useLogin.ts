"use client";

import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { AuthService } from "../services/auth.service";
import { useRouter } from "next/navigation";

type LoginFormData = {
  email: string;
  password: string;
};

export function useLogin() {
  const service = new AuthService();
  const router = useRouter();

  const form = useForm<LoginFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const { error } = await service.signIn(data.email, data.password);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      router.push("/");
    },
  });

  function onSubmit(data: LoginFormData) {
    mutation.mutate(data);
  }

  return {
    form,
    onSubmit,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error ? (mutation.error as Error).message : null,
  };
}
