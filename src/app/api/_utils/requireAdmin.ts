import { NextResponse } from "next/server";

import { isAdminTier, type UserTier } from "@/lib/auth/userTier";

import { requireUser } from "./requireUser";

type SupabaseAdminClient = {
  auth: {
    getUser: () => Promise<{
      data: { user: { id: string } | null };
      error: Error | null;
    }>;
  };
  from: (table: string) => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => {
        maybeSingle: () => Promise<{
          data: { tier: UserTier } | null;
          error: Error | null;
        }>;
      };
    };
  };
};

export async function requireAdmin(supabase: SupabaseAdminClient): Promise<
  | { user: { id: string }; errorResponse: null }
  | { user: null; errorResponse: NextResponse }
> {
  const auth = await requireUser(supabase);
  if (auth.errorResponse) return auth;

  const { data, error } = await supabase
    .from("users")
    .select("tier")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (error || !data || !isAdminTier(data.tier)) {
    return {
      user: null,
      errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { user: auth.user, errorResponse: null };
}
