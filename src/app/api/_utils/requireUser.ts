import { NextResponse } from "next/server";

type SupabaseWithAuth = {
  auth: {
    getUser: () => Promise<{
      data: { user: { id: string } | null };
      error: Error | null;
    }>;
  };
};

export async function requireUser(supabase: SupabaseWithAuth): Promise<
  | { user: { id: string }; errorResponse: null }
  | { user: null; errorResponse: NextResponse }
> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { user, errorResponse: null };
}
