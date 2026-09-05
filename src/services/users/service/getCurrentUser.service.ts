import { createClient } from "@/lib/supabase/server";
import type { UserTier } from "@/lib/auth/userTier";
import { User } from "@/types/user.types";

export type CurrentUserSession = {
  user: User;
  tier: UserTier | null;
};

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user as unknown as User;
}

export async function getCurrentUserSession(): Promise<CurrentUserSession | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("tier")
    .eq("id", user.id)
    .maybeSingle();

  return {
    user: user as unknown as User,
    tier: (profile?.tier as UserTier | null | undefined) ?? null,
  };
}
