import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/app/api/_utils/requireUser";
import { authorNameBody, DUPLICATE_AUTHOR_MESSAGE } from "./authorName";

export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireUser(supabase);
  if (auth.errorResponse) return auth.errorResponse;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = authorNameBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("authors")
    .insert({ name: parsed.data.name })
    .select("id, name")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: DUPLICATE_AUTHOR_MESSAGE },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
