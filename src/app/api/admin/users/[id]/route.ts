import { requireAdmin } from "@/app/api/_utils/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { NextResponse } from "next/server";
import { z } from "zod";

const patchBody = z.object({
  tier: z.literal("admin"),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const { id: targetId } = await ctx.params;
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if (auth.errorResponse) return auth.errorResponse;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
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
          "Operação administrativa não configurada. Defina SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 },
    );
  }

  const { data: target, error: targetError } = await adminClient
    .from("users")
    .select("id, tier")
    .eq("id", targetId)
    .maybeSingle();

  if (targetError) {
    return NextResponse.json({ error: targetError.message }, { status: 500 });
  }

  if (!target) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  if (target.tier === "admin") {
    return NextResponse.json({ ok: true as const, tier: "admin" as const });
  }

  const { error: updateError } = await adminClient
    .from("users")
    .update({ tier: "admin" })
    .eq("id", targetId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true as const, tier: "admin" as const });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { id: targetId } = await ctx.params;
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if (auth.errorResponse) return auth.errorResponse;

  if (auth.user.id === targetId) {
    return NextResponse.json(
      { error: "Você não pode excluir a si mesmo." },
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
          "Operação administrativa não configurada. Defina SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 },
    );
  }

  const { data: target, error: targetError } = await adminClient
    .from("users")
    .select("id, tier")
    .eq("id", targetId)
    .maybeSingle();

  if (targetError) {
    return NextResponse.json({ error: targetError.message }, { status: 500 });
  }

  if (!target) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  if (target.tier === "admin") {
    const { count, error: countError } = await adminClient
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("tier", "admin");

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { error: "Não é possível excluir o último admin." },
        { status: 409 },
      );
    }
  }

  const { data: bookRef, error: bookError } = await adminClient
    .from("books")
    .select("id")
    .eq("chosen_by", targetId)
    .limit(1)
    .maybeSingle();

  if (bookError) {
    return NextResponse.json({ error: bookError.message }, { status: 500 });
  }

  if (bookRef) {
    return NextResponse.json(
      {
        error:
          "Não é possível excluir: o usuário ainda é quem escolheu um ou mais livros (chosen_by).",
      },
      { status: 409 },
    );
  }

  const { error: profileDeleteError } = await adminClient
    .from("users")
    .delete()
    .eq("id", targetId);

  if (profileDeleteError) {
    return NextResponse.json(
      { error: profileDeleteError.message },
      { status: 500 },
    );
  }

  const { error: authDeleteError } =
    await adminClient.auth.admin.deleteUser(targetId);

  if (authDeleteError) {
    console.error("Auth deleteUser failed after profile delete", {
      userId: targetId,
      message: authDeleteError.message,
    });
    return NextResponse.json(
      {
        error:
          "Perfil removido, mas não foi possível remover o login. Contate o suporte.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true as const });
}
