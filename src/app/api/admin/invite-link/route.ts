import { createClient } from "@/lib/supabase/server";
import registerInvite from "@/lib/auth/registerInvite";
import { requireAdmin } from "@/app/api/_utils/requireAdmin";
import { NextResponse } from "next/server";

function buildInviteUrl(request: Request): string | null {
  if (!registerInvite.secretConfigured()) return null;
  const secret = process.env.REGISTER_INVITE_SECRET!.trim();
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    new URL(request.url).origin;
  return `${base}/register?invite=${encodeURIComponent(secret)}`;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if (auth.errorResponse) return auth.errorResponse;

  const inviteUrl = buildInviteUrl(request);

  return NextResponse.json({
    configured: Boolean(inviteUrl),
    inviteUrl,
  });
}
