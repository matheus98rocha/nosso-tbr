import { NextResponse } from "next/server";

import { isAdminTier } from "@/lib/auth/userTier";

import { requireUser } from "./requireUser";

type AdminGuardClient = {
  auth: {
    getUser: () => Promise<{
      data: { user: { id: string } | null };
      error: Error | null;
    }>;
  };
  from: (table: string) => any;
};

export async function requireAdmin(supabase: AdminGuardClient): Promise<
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
