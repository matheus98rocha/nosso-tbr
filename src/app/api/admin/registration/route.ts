import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/app/api/_utils/requireAdmin";
import {
  REGISTRATION_MODES,
  writeRegistrationMode,
  type RegistrationSettingsClient,
} from "@/lib/auth/registrationMode";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

const registrationModeBodySchema = z.object({
  mode: z.enum(REGISTRATION_MODES),
});

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if (auth.errorResponse) return auth.errorResponse;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = registrationModeBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

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

  const saved = await writeRegistrationMode(
    adminClient as unknown as RegistrationSettingsClient,
    {
      mode: parsed.data.mode,
      updatedBy: auth.user.id,
    },
  );

  if (!saved.ok) {
    console.error("Failed to update registration mode", saved.error);
    return NextResponse.json(
      { error: "Não foi possível alterar o modo de inscrição." },
      { status: 500 },
    );
  }

  return NextResponse.json({ mode: saved.mode });
}
