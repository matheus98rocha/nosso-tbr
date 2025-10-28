// src/lib/supabase/hooks.ts (Server Component)
import { createClient } from "@/lib/supabase/server";
import { User } from "@/types/user.types"; // Certifique-se de que este tipo é o correto

/**
 * Busca a sessão do usuário no Server Component (SSR).
 * Retorna o objeto User ou null.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user as unknown as User;
}
