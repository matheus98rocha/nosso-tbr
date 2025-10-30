"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { errorMapperSupabase } from "@/utils/error-mapper/error-mapper-supabase";
import { redirect } from "next/navigation";

export type LoginState = {
  error: string | null;
  message: string | null;
};

export async function loginAction(prevState: LoginState, formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  if (!data.email || !data.password) {
    return {
      error: "Email e senha são obrigatórios.",
      message: null,
    } as LoginState;
  }

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    const translatedError = errorMapperSupabase(error);

    return {
      error: translatedError,
      message: null,
    } as LoginState;
  }

  revalidatePath("/", "layout");
  redirect("/");
}
