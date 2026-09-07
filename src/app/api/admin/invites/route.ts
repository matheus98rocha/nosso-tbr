import { NextResponse } from "next/server";

import { requireAdmin } from "@/app/api/_utils/requireAdmin";
import {
  buildInviteUrl,
  createInviteToken,
  inviteExpiresAt,
} from "@/lib/auth/registerInvite";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

export async function GET(request: Request) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if (auth.errorResponse) return auth.errorResponse;

  let adminClient;
  try {
    adminClient = createServiceRoleClient();
  } catch {
    return NextResponse.json(
      {
        error:
          "Convites não estão configurados no servidor. Defina SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 },
    );
  }

  const nowIso = new Date().toISOString();
  const { data, error } = await adminClient
    .from("register_invites")
    .select("id, token, expires_at, created_at")
    .gt("expires_at", nowIso)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to list register_invites", {
      code: error.code,
      message: error.message,
    });
    return NextResponse.json(
      { error: "Não foi possível listar os convites." },
      { status: 500 },
    );
  }

  const invites = (data ?? []).map((row) => ({
    ...row,
    inviteUrl: buildInviteUrl(request, row.token),
  }));

  return NextResponse.json({ invites });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if (auth.errorResponse) return auth.errorResponse;

  let adminClient;
  try {
    adminClient = createServiceRoleClient();
  } catch {
    return NextResponse.json(
      {
        error:
          "Convites não estão configurados no servidor. Defina SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 },
    );
  }

  const token = createInviteToken();
  const expiresAt = inviteExpiresAt().toISOString();

  const { data, error } = await adminClient
    .from("register_invites")
    .insert({
      token,
      expires_at: expiresAt,
      created_by: auth.user.id,
    })
    .select("id, token, expires_at, created_at")
    .single();

  if (error || !data) {
    console.error("Failed to create register_invite", {
      code: error?.code,
      message: error?.message,
    });
    return NextResponse.json(
      { error: "Não foi possível gerar o convite." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      invite: data,
      inviteUrl: buildInviteUrl(request, data.token),
    },
    { status: 201 },
  );
}
