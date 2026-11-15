import { requireUser } from "@/app/api/_utils/requireUser";
import {
  deleteReaderAccount,
  type ReaderDeletionClient,
} from "@/lib/users/deleteReaderAccount";
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

  const result = await deleteReaderAccount(
    adminClient as unknown as ReaderDeletionClient,
    auth.user.id,
  );

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 500 },
    );
  }

  return NextResponse.json({ ok: true as const });
}
