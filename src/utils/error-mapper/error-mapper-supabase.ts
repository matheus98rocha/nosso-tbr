// src/utils/errorMapper.ts

import { PostgrestError, AuthError } from "@supabase/supabase-js";

type SupabaseError = PostgrestError | AuthError | null;

export function errorMapperSupabase(error: SupabaseError): string {
  if (!error || !error.message) {
    return "Ocorreu um erro desconhecido. Tente novamente.";
  }

  if (error instanceof AuthError) {
    if (error.message.includes("Invalid login credentials")) {
      return "Credenciais de login inválidas. Verifique seu email e senha.";
    }
    if (error.message.includes("Email not confirmed")) {
      return "O seu email ainda não foi confirmado. Verifique sua caixa de entrada.";
    }
    if (error.message.includes("User already registered")) {
      return "Este email já está cadastrado. Tente fazer o login ou redefinir a senha.";
    }
  }

  return "Ocorreu um erro inesperado. Detalhes: " + error.message;
}
