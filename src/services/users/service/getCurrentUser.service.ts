import { createClient } from "@/lib/supabase/server";
import { User } from "@/types/user.types";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user as unknown as User;
}
