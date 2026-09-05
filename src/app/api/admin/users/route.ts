import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/app/api/_utils/requireAdmin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if (auth.errorResponse) return auth.errorResponse;

  const { data, error } = await supabase
    .from("users")
    .select("id, display_name, email, tier")
    .order("display_name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? [], {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
