import { requireUser } from "@/app/api/_utils/requireUser";
import {
  deleteReaderAccount,
  type ReaderDeletionClient,
} from "@/lib/users/deleteReaderAccount";
import { lastAdminDeletionBlock } from "@/lib/users/lastAdminDeletionBlock";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { NextResponse } from "next/server";

export async function DELETE() {
  const supabase = await createClient();
  const auth = await requireUser(supabase);
  if (auth.errorResponse) return auth.errorResponse;

  let adminClient;
  try {
    adminClient = createServiceRoleClient();
  } catch {
    return NextResponse.json(
      {
        error:
          "Operação administrativa não configurada. Defina SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 },
    );
  }

  const { data: self, error: selfError } = await adminClient
    .from("users")
    .select("id, tier")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (selfError) {
    return NextResponse.json({ error: selfError.message }, { status: 500 });
  }

  if (!self) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  const lastAdmin = await lastAdminDeletionBlock(adminClient, self.tier);
  if (lastAdmin) {
    return NextResponse.json(
      { error: lastAdmin.error },
      { status: lastAdmin.status },
    );
  }

  const result = await deleteReaderAccount(
    adminClient as unknown as ReaderDeletionClient,
    auth.user.id,
  );

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true as const });
}
