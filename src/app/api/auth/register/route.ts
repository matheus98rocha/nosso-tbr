import registerInvite from "@/lib/auth/registerInvite";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { registerUserBodySchema } from "@/services/userRegistration/validators/userRegistration.validator";
import { NextResponse } from "next/server";

function mapAuthErrorToClientMessage(errorCode?: string): string {
  switch (errorCode) {
    case "user_already_exists":
    case "email_exists":
      return "Não foi possível concluir o cadastro com esse e-mail.";
    case "weak_password":
      return "A senha informada não atende aos requisitos mínimos.";
    default:
      return "Não foi possível concluir o cadastro. Tente novamente.";
  }
}

export async function POST(request: Request) {
  if (!registerInvite.secretConfigured()) {
    return NextResponse.json(
      {
        error:
          "Cadastro por convite não está configurado no servidor. Defina REGISTER_INVITE_SECRET.",
      },
      { status: 503 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = registerUserBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (!registerInvite.tokenValid(parsed.data.invite)) {
    return NextResponse.json(
      {
        error:
          "Convite inválido ou expirado. Peça um novo link de cadastro.",
      },
      { status: 403 },
    );
  }

  const { email, password, display_name } = parsed.data;

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

  const { data: created, error: createError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createError) {
    console.error("Auth createUser failed during registration", {
      code: createError.code,
      message: createError.message,
      status: createError.status,
    });

    return NextResponse.json(
      { error: mapAuthErrorToClientMessage(createError.code) },
      { status: 400 },
    );
  }

  const userId = created.user?.id;
  if (!userId) {
    console.error("Auth createUser succeeded without returning a user", {
      email,
    });

    return NextResponse.json(
      { error: "Registration did not return a user" },
      { status: 400 },
    );
  }

  const { error: upsertError } = await adminClient.from("users").upsert(
    {
      id: userId,
      display_name,
      email,
      tier: "common_user",
    },
    { onConflict: "id" },
  );

  if (upsertError) {
    console.error("Profile upsert failed after auth createUser", {
      userId,
      email,
      code: upsertError.code,
      message: upsertError.message,
      details: upsertError.details,
      hint: upsertError.hint,
    });

    return NextResponse.json(
      {
        error:
          "Cadastro criado, mas não foi possível salvar seu perfil agora. Tente novamente em instantes.",
      },
      { status: 500 },
    );
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    console.error("signInWithPassword failed after registration", {
      userId,
      email,
      code: signInError.code,
      message: signInError.message,
    });

    return NextResponse.json(
      {
        error:
          "Conta criada, mas não foi possível entrar automaticamente. Faça login.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
