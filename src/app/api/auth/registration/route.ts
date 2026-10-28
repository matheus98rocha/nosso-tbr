import { NextResponse } from "next/server";

import {
  readRegistrationMode,
  type RegistrationSettingsClient,
} from "@/lib/auth/registrationMode";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  let adminClient;
  try {
    adminClient = createServiceRoleClient();
  } catch {
    return NextResponse.json(
      {
        error:
          "Cadastro não está configurado no servidor. Defina SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 },
    );
  }

  const settings = await readRegistrationMode(
    adminClient as unknown as RegistrationSettingsClient,
  );

  if (!settings.ok) {
    console.error("Failed to read registration mode", settings.error);
    return NextResponse.json(
      { error: "Não foi possível verificar o modo de inscrição." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { mode: settings.mode },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
