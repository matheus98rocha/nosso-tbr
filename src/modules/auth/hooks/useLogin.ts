"use client";

import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { AuthService } from "../services/auth.service";
import { useRouter } from "next/navigation";
import { User } from "@/types/user.types";
import { useUserStore } from "@/stores/userStore";

type LoginFormData = {
  email: string;
  password: string;
};

export function useLogin() {
  const service = new AuthService();
  const router = useRouter();

  const set = useUserStore.setState;

  const form = useForm<LoginFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const { data: authData, error } = await service.signIn(
        data.email,
        data.password
      );

      if (error) throw new Error(error.message);
      console.log(error);
      return authData;
    },
    onSuccess: (authData) => {
      set({ user: authData.user as unknown as User, loading: false });
      if (authData?.user?.id) {
        router.push(`/?userId=${authData.user.id}`);
      }
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
    mutation,
  };
}
